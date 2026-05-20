/**
 * 玩机管家安卓版专属行为统计API
 * POST /api/admtapk - 记录安卓端软件使用和设备信息
 */

import { NextRequest } from "next/server";
import {
  unifiedDb as userBehaviorDb,
  softwareUsage,
  deviceConnections,
} from "@/lib/unified-db-connection";
import { blockedItems } from "@/lib/system-settings-schema";
import { eq, and, sql } from "drizzle-orm";
import { corsResponse, handleOptions, getClientIp } from "@/lib/cors";
import { checkUserBehaviorRateLimit } from "@/lib/user-behavior-rate-limit";
import { z } from "zod";

// 安卓版专属软件ID
const ADMT_APK_SOFTWARE_ID = 19;
const ADMT_APK_SOFTWARE_NAME = "玩机管家安卓版";

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("Origin");
  const userAgent = request.headers.get("User-Agent");
  return handleOptions(origin, userAgent);
}

const admtApkRequestSchema = z.object({
  deviceFingerprint: z.string().min(1), // 用于软件使用的唯一标识
  deviceSerial: z.string().optional(), // 序列号（如无可回退使用deviceFingerprint）
  deviceBrand: z.string().optional(), // 品牌
  deviceModel: z.string().optional(), // 型号
  softwareVersion: z.string().optional(), // 软件版本
  used: z.number().int().positive().optional().default(1), // 使用次数增量
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("Origin");
  const userAgent = request.headers.get("User-Agent");

  try {
    const clientIp = getClientIp(request);
    
    // 复用 user-behavior 的频率限制逻辑
    const rateLimitResult = checkUserBehaviorRateLimit(clientIp, "admtapk-post");
    if (!rateLimitResult.allowed) {
      return corsResponse(
        { success: false, error: rateLimitResult.error || "Rate limit exceeded" },
        {
          status: 429,
          headers: rateLimitResult.retryAfter
            ? { "Retry-After": rateLimitResult.retryAfter.toString() }
            : undefined,
        },
        origin,
        userAgent
      );
    }

    const bodyText = await request.text();
    if (!bodyText) {
      return corsResponse({ success: false, error: "请求体不能为空" }, { status: 400 }, origin, userAgent);
    }

    const body = JSON.parse(bodyText);
    const validatedData = admtApkRequestSchema.parse(body);
    const actualDeviceSerial = validatedData.deviceSerial || validatedData.deviceFingerprint;

    // 检查黑名单 (检查 fingerprint 或 serial)
    const blocked = await userBehaviorDb
      .select()
      .from(blockedItems)
      .where(
        and(
          eq(blockedItems.type, "device"),
          eq(blockedItems.isActive, true),
          sql`${blockedItems.value} IN (${validatedData.deviceFingerprint}, ${actualDeviceSerial})`
        )
      )
      .limit(1);

    if (blocked.length > 0) {
      return corsResponse(
        {
          success: true,
          message: "设备由于在黑名单中被忽略",
          data: { ignored: true },
        },
        undefined,
        origin,
        userAgent
      );
    }

    // 1. 记录 Software Usage (软件使用统计)
    const existingUsage = await userBehaviorDb
      .select()
      .from(softwareUsage)
      .where(
        and(
          eq(softwareUsage.deviceFingerprint, validatedData.deviceFingerprint),
          eq(softwareUsage.softwareId, ADMT_APK_SOFTWARE_ID)
        )
      )
      .limit(1);

    if (existingUsage.length > 0) {
      await userBehaviorDb
        .update(softwareUsage)
        .set({
          used: sql`${softwareUsage.used} + ${validatedData.used}`,
          usedAt: new Date(),
          updatedAt: new Date(),
          softwareVersion: validatedData.softwareVersion || existingUsage[0].softwareVersion,
        })
        .where(
          and(
            eq(softwareUsage.deviceFingerprint, validatedData.deviceFingerprint),
            eq(softwareUsage.softwareId, ADMT_APK_SOFTWARE_ID)
          )
        );
    } else {
      await userBehaviorDb.insert(softwareUsage).values({
        softwareId: ADMT_APK_SOFTWARE_ID,
        softwareName: ADMT_APK_SOFTWARE_NAME,
        softwareVersion: validatedData.softwareVersion,
        deviceFingerprint: validatedData.deviceFingerprint,
        used: validatedData.used,
        usedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 2. 记录 Device Connection (设备连接统计 - 简略设备信息)
    const existingDevice = await userBehaviorDb
      .select()
      .from(deviceConnections)
      .where(
        and(
          eq(deviceConnections.deviceSerial, actualDeviceSerial),
          eq(deviceConnections.softwareId, ADMT_APK_SOFTWARE_ID)
        )
      )
      .limit(1);

    if (existingDevice.length > 0) {
      await userBehaviorDb
        .update(deviceConnections)
        .set({
          linked: existingDevice[0].linked + 1,
          updatedAt: new Date(),
          deviceBrand: validatedData.deviceBrand || existingDevice[0].deviceBrand,
          deviceModel: validatedData.deviceModel || existingDevice[0].deviceModel,
        })
        .where(
          and(
            eq(deviceConnections.deviceSerial, actualDeviceSerial),
            eq(deviceConnections.softwareId, ADMT_APK_SOFTWARE_ID)
          )
        );
    } else {
      await userBehaviorDb.insert(deviceConnections).values({
        deviceSerial: actualDeviceSerial,
        softwareId: ADMT_APK_SOFTWARE_ID,
        deviceBrand: validatedData.deviceBrand,
        deviceModel: validatedData.deviceModel,
        userDeviceFingerprint: validatedData.deviceFingerprint,
        linked: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return corsResponse(
      {
        success: true,
        message: "使用记录和设备信息更新成功",
      },
      undefined,
      origin,
      userAgent
    );
  } catch (error) {
    console.error("Error recording admtapk usage:", error);
    if (error instanceof z.ZodError) {
      return corsResponse({ success: false, error: "请求数据格式错误", details: error.issues }, { status: 400 }, origin, userAgent);
    }
    return corsResponse({ success: false, error: "记录失败" }, { status: 500 }, origin, userAgent);
  }
}
