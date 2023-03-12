import { Username } from "../decorator/username.decorator";

export class OneUsernameDTO 
{
	@Username()
	username: string
}
