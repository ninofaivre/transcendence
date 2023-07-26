import { ContractPlainType, HTTPStatusCode, initContract } from "@ts-rest/core"

type Codes =
    | "NotFoundUser" | "NotFoundUserForValidToken"
    | "UserAlreadyExist" | "DmAlreadyExist"
    | "BlockedByUser" | "BlockedUser" | "ProximityLevelTooLow"
    | "ContentModifiedBetweenCreationAndRead" | "ContentModifiedBetweenUpdateAndRead"

// TODO: naming is a bit dirty
type Action = "createDm"

// as const is only useful for precise type of message
export const contractErrors = {

    /**
     * @remarks error that should theoretically never happens, it exists mostly for type safety
     */
    NotFoundUserForValidToken: (username: string) => ({
        status: 404,
        body: {
            code: "NotFoundUserForValidToken",
            message: `not found user ${username} from valid token (account has probably been deleted)`
        }
    } as const),

    NotFoundUser: (username: string, custom?: string) => ({
        status: 404,
        body: {
            code: "NotFoundUser",
            message: `not found user ${username}${custom ? ' ' + custom : ''}`
        }
    } as const),

    UserAlreadyExist: (username: string) => ({
        status: 409,
        body: {
            code: "UserAlreadyExist",
            message: `user ${username} already exist`
        }
    } as const),

    DmAlreadyExist: (username: string, otherUserName: string) => ({
        status: 409,
        body: {
            code: "DmAlreadyExist",
            message: `Dm between ${username} and ${otherUserName} already exist`
        }
    } as const),

    BlockedByUser: (username: string, action: Action) => ({
        status: 403,
        body: {
            code: "BlockedByUser",
            message: `action ${action} is forbidden because user ${username} blocked you`
        }
    } as const),

    BlockedUser: (username: string, action: Action) => ({
        status: 403,
        body: {
            code: "BlockedUser",
            message: `action ${action} is forbidden because you blocked ${username}`
        }
    } as const),

    ProximityLevelTooLow: (username: string, action: Action,
        proximity: string, accessLevel: string
    ) => ({
        status: 403,
        body: {
            code: "ProximityLevelTooLow",
            message: `action ${action} is forbidden because your proximity (${proximity}) is tool low with user ${username} (need to be at least ${accessLevel})`
        }
    } as const),

    /**
     * @remarks error that should theoretically never happens, it exists mostly for type safety
     */
    ContentModifiedBetweenCreationAndRead: (subject: 'ChanMessage' | 'DmMessage') => ({
        status: 200,
        body: {
            code: "ContentModifiedBetweenCreationAndRead",
            message: `Content for subject ${subject} has beed modified between it's creation (with your parameters) and the read, making the server unable to return you the data you expect`
        }
    } as const),

    /**
     * @remarks error that should theoretically never happens, it exists mostly for type safety
     */
    ContentModifiedBetweenUpdateAndRead: (subject: 'ChanMessage' | 'DmMessage') => ({
        status: 200,
        body: {
            code: "ContentModifiedBetweenUpdateAndRead",
            message: `Content for subject ${subject} has beed modified between it's creation (with your parameters) and the read, making the server unable to return you the data you expect`
        }
    } as const)
} satisfies { [Code in Codes]: (...args: any) => ContractError<Code> }

type ContractError<Code = Codes> = {
    status: HTTPStatusCode,
    body: {
        code: Code,
        message?: string
    }
}

type GetError< Code extends Codes = Codes, Status = number > =
    Extract<ReturnType<typeof contractErrors[Code]>, { status: Status }>

type GetErrorBody<Code extends Codes, Status = number> = GetError<Code, Status>['body']

// don't expose this function, it is unsafe to use it outside of getErrorForContract
// or getErrorsForContract
function localGetErrorForContract<
    Code extends Codes,
    Status extends GetError<Code>['status']
>(c: ReturnType<typeof initContract>, status: Status, ...code: Code[])
: { [key in Status]: ContractPlainType<GetErrorBody<Code>> } {
    let toReturn: { [key in number]: ContractPlainType<GetErrorBody<Code>> } = {}
    toReturn[status] = c.type<GetErrorBody<Code>>()
    return toReturn
}

// purpose of this function is to ensure that there is no missmatch between
// the status code defined in the contract and the one returned by the back
// in case of error
export const getErrorForContract = <
    Status extends GetError['status'],
    Code extends Codes & GetErrorBody<Codes, Status>['code']
>(c: ReturnType<typeof initContract>, status: Status, ...code: Code[]) =>
    localGetErrorForContract(c, status, ...code)

export function getErrorsForContract<
    Status extends GetError['status'],
    Code extends Codes & GetErrorBody<Codes, Status>['code']
>(c: ReturnType<typeof initContract>, ...args: [Status, ...Code[]][]) {
    return args.reduce(
        (res, curr) => ({ ...res, ...localGetErrorForContract(c, ...curr) }),
        {} as { [key in Status]: ContractPlainType<GetError<Code, key>['body']> }
    )
}

export function isContractError(toTest: any): toTest is ContractError {
    return !!(toTest.status && typeof toTest.status === 'number'
        && toTest.body && toTest.body.code && typeof toTest.body.code === 'string')
}
