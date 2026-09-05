import { ExecutionContext } from "@nestjs/common"
import { PayloadType } from "../../types/payload.type";

export const currentUser = () => {
    (data, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        const payload: PayloadType = request["user"];
        return payload
    }
}