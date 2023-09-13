import { Controller, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "src/auth/jwt-auth.guard"
import { ChansService } from "./chans.service"
import { contract, isContractError } from "contract"
import { TsRest, TsRestHandler, tsRestHandler } from "@ts-rest/nest"
import { EnrichedRequest } from "src/types"

const c = contract.chans

@Controller()
@TsRest({ jsonQuery: true })
export class ChansController {
	constructor(private readonly chansService: ChansService) {}

    @UseGuards(JwtAuthGuard)
    @TsRestHandler(c)
    async handler(@EnrichedRequest(){ user }: EnrichedRequest) {
        const { username } = user
        return tsRestHandler(c, {
            searchChans: async ({ query }) => ({
                status: 200,
                body: await this.chansService.searchChans(username, query)
            }),

            getMyChans: async () => ({
                status: 200,
                body: await this.chansService.getUserChans(username)
            }),

            leaveChan: async ({ params: { chanId } }) => {
                const res = await this.chansService.leaveChan(user, chanId)
                return isContractError(res) ? res : { status: 204, body: null }
            },

            joinChan: async ({ body }) => {
                const res = await this.chansService.joinChan(user, body)
                return isContractError(res) ? res : { status: 200, body: res }
            },

            createChan: async ({ body }) => {
                const res = await this.chansService.createChan(user, body)
                return isContractError(res) ? res: { status: 201, body: res }
            },

            deleteChan: async ({ params: { chanId } }) => {
                const res = await this.chansService.deleteChan(user, chanId)
                return isContractError(res) ? res : { status: 204, body: null }
            },

            createChanMessage: async ({ params: { chanId }, body }) => {
                const res = await this.chansService.createChanMessageIfRightTo(user, chanId, body)
                return isContractError(res) ? res : { status: 201, body: res }
            },

            getChanElements: async ({ params: { chanId }, query }) => {
                const res = await this.chansService.getChanElements(username, chanId, query)
                return isContractError(res) ? res : { status: 200, body: res }
            },

            updateChanMessage: async ({ params, body: { content } }) => {
                const res = await this.chansService.updateChanMessageIfRightTo(user, params, content)
                return isContractError(res) ? res : { status: 200, body: res }
            },

            deleteChanMessage: async ({ params }) => {
                const res = await this.chansService.deleteChanMessageIfRightTo(user, params)
                return isContractError(res) ? res : { status: 200, body: res }
            },

            kickUserFromChan: async ({ params }) => {
                const res = await this.chansService.kickUserFromChanIfRightTo(user, params)
                return isContractError(res) ? res : { status: 204, body: null }
            },

            muteUserFromChan: async ({ params, body: { timeoutInMs } }) => {
                const res = await this.chansService.muteUserFromChanIfRightTo(username, params, timeoutInMs)
                return isContractError(res) ? res : { status: 204, body: null }
            },

            banUserFromChan: async ({ params, body: { timeoutInMs } }) => {
                const res = await this.chansService.banUserFromChanIfRighTo(user, params, timeoutInMs)
                return isContractError(res) ? res : { status: 204, body: null }
            },

            unbanUserFromChan: async ({ params }) => {
                const res = await this.chansService.unbanUserIfRightTo(username, params)
                return isContractError(res) ? res : { status: 204, body: null }
            },

            unmuteUserFromChan: async ({ params }) => {
                const res = await this.chansService.unmuteUserIfRightTo(username, params)
                return isContractError(res) ? res : { status: 204, body: null }
            },

            // BH //
            setUserAdminState: async ({ body: { state }, params }) => {
                const res = await this.chansService.setUserAdminStateIfRightTo(username, state, params)
                return isContractError(res) ? res : { status: 204, body: null }
            },
            // BH //
            
            updateChan: async ({ params: { chanId }, body }) => {
                const res = await this.chansService.updateChan(user, chanId, body)
                return isContractError(res) ? res : { status: 204, body: null }
            }
        })
    }
}
