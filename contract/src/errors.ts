import { ContractPlainType, HTTPStatusCode, initContract } from "@ts-rest/core"
import { z } from "zod"
import { zPermissionList } from "./generated-zod/"
import { zSelfPermissionList } from "./routers/chans"

type Codes =
    | "OnlyAvailableInDevMode"
	| "NotFoundUser"
    | "InvalidProfilePicture"
    | "ServerUnableToWriteProfilePicture"
	| "NotFoundUserForValidToken"
	| "NotFoundChan"
	| "NotFoundProfilePicture"
	| "UserAlreadyExist"
	| "DmAlreadyExist"
	| "ChanUserAlreadyExist"
	| "ChanAlreadyExist"
	| "BlockedByUser"
	| "BlockedUser"
	| "ProximityLevelTooLow"
	| "OwnerCannotLeaveChan"
	| "ChanPermissionTooLow"
	| "ChanPermissionTooLowOverUser"
	| "ChanDoesntNeedPassword"
	| "ChanNeedPassword"
	| "ChanWrongPassword"
	| "NotFoundChanEntity"
	| "NotOwnedChanMessage"
    | "UserBannedFromChan"
    | "Unauthorized"

// as const is only useful for precise type of message
export const contractErrors = {

    OnlyAvailableInDevMode: (feature: 'loginDev') =>
    ({
        status: 403,
        body: {
            code: "OnlyAvailableInDevMode",
            message: `Forbidden, feature ${feature} is only available in devMode !`
        }
    } as const),

    Unauthorized: () =>
    ({
        status: 401,
        body: {
            code: "Unauthorized",
            message: "unauthorized, should authenticate to go further"
        }
    } as const),

	/**
	 * @remarks error that should theoretically never happens, it exists mostly for type safety
	 * please trigger logout and refresh page on this error
	 */
	NotFoundUserForValidToken: (username: string) =>
		({
			status: 404,
			body: {
				code: "NotFoundUserForValidToken",
				message: `not found user ${username} from valid token (account has probably been deleted)`,
			},
		}) as const,

	NotFoundProfilePicture: (username: string) =>
		({
			status: 404,
			body: {
				code: "NotFoundProfilePicture",
				message: `not found profilePicture for user ${username}`,
			},
		}) as const,

    InvalidProfilePicture: (reason: 'no file' | 'unsupported mimetype' | 'not square' | 'too small') => 
    ({
        status: 400,
        body: {
            code: "InvalidProfilePicture",
            message: `profile picture is not valid for the following reason : '${reason}'`
        }
    } as const),
    
    ServerUnableToWriteProfilePicture: () =>
    ({
        status: 409,
        body: {
            code: "ServerUnableToWriteProfilePicture",
            message: `the profile picture was considered valid but server was not able tow write it to the file system, this might be due to misconfigured permissions / profile picture destination folder`
        }
    } as const),

	NotFoundUser: (username: string, custom?: string) =>
		({
			status: 404,
			body: {
				code: "NotFoundUser",
				message: `not found user ${username}${custom ? " " + custom : ""}`,
			},
		}) as const,

	NotFoundChan: (chanId: string) =>
		({
			status: 404,
			body: {
				code: "NotFoundChan",
				message: `not found chan ${chanId}`,
			},
		}) as const,

	UserAlreadyExist: (username: string) =>
		({
			status: 409,
			body: {
				code: "UserAlreadyExist",
				message: `user ${username} already exist`,
			},
		}) as const,

	ChanUserAlreadyExist: (username: string, chanId: string) =>
		({
			status: 409,
			body: {
				code: "ChanUserAlreadyExist",
				message: `user ${username} already exist in chan ${chanId}`,
			},
		}) as const,

	ChanAlreadyExist: (title: string) =>
		({
			status: 409,
			body: {
				code: "ChanAlreadyExist",
				message: `chan with title ${title} already exist`,
			},
		}) as const,

	DmAlreadyExist: (username: string, otherUserName: string) =>
		({
			status: 409,
			body: {
				code: "DmAlreadyExist",
				message: `Dm between ${username} and ${otherUserName} already exist`,
			},
		}) as const,

	BlockedByUser: (username: string, action: "createDm") =>
		({
			status: 403,
			body: {
				code: "BlockedByUser",
				message: `action ${action} is forbidden because user ${username} blocked you`,
			},
		}) as const,

	BlockedUser: (username: string, action: "createDm") =>
		({
			status: 403,
			body: {
				code: "BlockedUser",
				message: `action ${action} is forbidden because you blocked ${username}`,
			},
		}) as const,

	ProximityLevelTooLow: (
		username: string,
		action: "createDm",
		proximity: string,
		accessLevel: string,
	) =>
		({
			status: 403,
			body: {
				code: "ProximityLevelTooLow",
				message: `action ${action} is forbidden because your proximity (${proximity}) is tool low with user ${username} (need to be at least ${accessLevel})`,
			},
		}) as const,

	OwnerCannotLeaveChan: () =>
		({
			status: 403,
			body: {
				code: "OwnerCannotLeaveChan",
				message: "owner can't leave chan (transfer ownerShip or Delete chan)",
			},
		}) as const,

	ChanPermissionTooLow: (
		username: string,
		chanId: string,
		perm: z.infer<typeof zSelfPermissionList> | "ROLES_ATTRIBUTION",
	) =>
		({
			status: 403,
			body: {
				code: "ChanPermissionTooLow",
				message: `user ${username} doesn't have permission ${perm} in chan ${chanId}`,
			},
		}) as const,

	ChanPermissionTooLowOverUser: (
		username: string,
		otherUserName: string,
		chanId: string,
		perm: Exclude<z.infer<typeof zPermissionList>, z.infer<typeof zSelfPermissionList>>,
	) =>
		({
			status: 403,
			body: {
				code: "ChanPermissionTooLowOverUser",
				message: `user ${username} doesn't have permission ${perm} over user ${otherUserName} in chan ${chanId}`,
			},
		}) as const,

	ChanDoesntNeedPassword: (chanId: string) =>
		({
			status: 400,
			body: {
				code: "ChanDoesntNeedPassword",
				message: `a password was provided but chan ${chanId} doesn't need one to be joined`,
			},
		}) as const,

	ChanNeedPassword: (chanId: string) =>
		({
			status: 400,
			body: {
				code: "ChanNeedPassword",
				message: `chan ${chanId} need a password to be joined but none was provided`,
			},
		}) as const,

    ChanWrongPassword: (chanId: string) => ({
        status: 403,
        body: {
            code: "ChanWrongPassword",
            message: `password provided to join chan ${chanId} is not valid`
        }
    } as const),

    NotFoundChanEntity: (chanId: string,
        entityType: "relatedTo element" | "element" | "message" | "user" | "bannedUser" | "role",
        entityId: string,
    ) => ({
        status: 404,
        body: {
            code: "NotFoundChanEntity",
            message: `not found ${entityType} ${entityId} in chan ${chanId}`,
            entityType
        }
    } as const),

    NotOwnedChanMessage: (username: string, action: 'update', chanId: string, messageId: string) => ({
        status: 403,
        body: {
            code: "NotOwnedChanMessage",
            message: `user ${username} can't ${action} message ${messageId} in chan ${chanId} because he is not the owner of it`
        }
    } as const),

    UserBannedFromChan: (username: string, chanId: string, timeout: Date | null) => ({
        status: 403,
        body: {
            code: "UserBannedFromChan",
            message: `user ${username} is banned from chan ${chanId} ${timeout ? `until ${timeout}` : 'for ever'}`
        }
    } as const),

} satisfies { [Code in Codes]: (...args: any) => ContractError<Code> }

type ContractError<Code = Codes> = {
	status: HTTPStatusCode
	body: {
		code: Code
		message?: string
	}
}

type GetError<Code extends Codes = Codes, Status = number> = Extract<
	ReturnType<(typeof contractErrors)[Code]>,
	{ status: Status }
>

type GetErrorBody<Code extends Codes, Status = number> = GetError<Code, Status>["body"]

// don't expose this function, it is unsafe to use it outside of getErrorForContract
// or getErrorsForContract
function localGetErrorForContract<Code extends Codes, Status extends GetError<Code>["status"]>(
	c: ReturnType<typeof initContract>,
	status: Status,
	...code: Code[]
): { [key in Status]: ContractPlainType<GetErrorBody<Code>> } {
	let toReturn: { [key in number]: ContractPlainType<GetErrorBody<Code>> } = {}
	toReturn[status] = c.type<GetErrorBody<Code>>()
	return toReturn
}

// purpose of this function is to ensure that there is no missmatch between
// the status code defined in the contract and the one returned by the back
// in case of error
export const getErrorForContract = <
	Status extends GetError["status"],
	Code extends Codes & GetErrorBody<Codes, Status>["code"],
>(
	c: ReturnType<typeof initContract>,
	status: Status,
	...code: Code[]
) => localGetErrorForContract(c, status, ...code)

export function getErrorsForContract<
	Status extends GetError["status"],
	Code extends Codes & GetErrorBody<Codes, Status>["code"],
>(c: ReturnType<typeof initContract>, ...args: [Status, ...Code[]][]) {
	return args.reduce(
		(res, curr) => ({ ...res, ...localGetErrorForContract(c, ...curr) }),
		{} as { [key in Status]: ContractPlainType<GetError<Code, key>["body"]> },
	)
}

export function isContractError(toTest: unknown): toTest is ContractError {
	return !!(
		typeof toTest === "object" && toTest &&
		"status" in toTest && typeof toTest["status"] === "number" &&
		"body" in toTest && typeof toTest["body"] === "object" && toTest["body"] &&
		"code" in toTest["body"] && typeof toTest["body"]["code"] === "string" &&
        (!("message" in toTest["body"]) || !toTest["body"]["message"] || typeof toTest["body"]["message"] === "string")
	)
}

export const isErrorCode = (ret: { status: HTTPStatusCode, body: unknown }, code: Codes) =>
    (isContractError(ret) && ret.body.code === code)
