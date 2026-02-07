import knex from "../db";
import { Request } from "express";

interface LogActivityParams {
    userId?: number;
    action: string;
    entityType?: string;
    entityId?: number;
    details?: object;
    req?: Request;
}

export const logActivity = async (params: LogActivityParams) => {
    const { userId, action, entityType, entityId, details, req } = params;

    await knex("activity_log").insert({
        user_id: userId || null,
        action,
        entity_type: entityType || null,
        entity_id: entityId || null,
        details: details ? JSON.stringify(details) : null,
        ip_address: req?.ip || req?.socket?.remoteAddress || null,
        user_agent: req?.get("user-agent") || null,
        create_time: Date.now()
    });
};
