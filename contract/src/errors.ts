import { ContractPlainType, initContract } from "@ts-rest/core"

type Codes = "NotFoundUser" | "UserAlreadyExist"

//TODO: permettre de directement mettre l'erreur sans fonction pour les erreurs
// qui n'ont pas besoin d'être générées

// don't forget the as const it won't work otherwise
export const contractErrors = {

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
    } as const)

} satisfies { [Code in Codes]: (...args: any) => ContractError<Code> }

type ContractError<Code = Codes> = {
    status: number,
    body: {
        code: Code,
        message?: string
    }
}

type GetError<Code extends Codes, Status = number> =
    Extract<ReturnType<typeof contractErrors[Code]>, { status: Status }>

type GetErrorBody<Code extends Codes, Status = number> = GetError<Code, Status>['body']

// purpose of this function is to ensure that there is no missmatch between
// the status code defined in the contract and the one returned by the back
// in case of error
export function getErrorForContract<
        Code extends Codes,
        Status extends GetError<Code>['status']
    >(c: ReturnType<typeof initContract>, status: Status, code: Code)
: { [key in Status]: ContractPlainType<GetErrorBody<Code>> } {
    let toReturn: { [key in number]: ContractPlainType<GetErrorBody<Code>> } = {}
    toReturn[status] = c.type<GetErrorBody<Code>>()
    return toReturn
}


export function getErrorsForContract<
    Code extends Codes,
    Status extends GetError<Code>['status']
>(c: ReturnType<typeof initContract>, ...args: [Status, Code][]) {
    return args.reduce(
        (res, curr) => ({ ...res, ...getErrorForContract(c, curr[0], curr[1]) }),
        {} as { [key in Status]: ContractPlainType<GetError<Code, key>['body']> }
    )
}

export function isContractError(toTest: any): toTest is ContractError {
    return !!(toTest.status && typeof toTest.status === 'number'
        && toTest.body && toTest.body.code && typeof toTest.body.code === 'string')
}
