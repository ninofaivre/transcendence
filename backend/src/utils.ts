import { HttpException } from "@nestjs/common";
import { ContractErrorUnion } from "contract";

export const getHttpExceptionFromContractError = (error: ContractErrorUnion)  =>
    new HttpException(error.body, error.status)
