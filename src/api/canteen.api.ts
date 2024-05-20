import { drizzle } from "drizzle-orm/neon-http";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { canteens } from "../db/schema";
import {
  createCanteenRepo,
  deleteCanteenRepo,
  getAllCanteenRepo,
  getAllCanteensWithSignatureMenus,
  updateCanteenRepo,
} from "../repositories/canteen.repository";
import { Hono } from "hono";
import { Env } from "..";
import { v4 as uuidv4 } from "uuid";
import { neon } from "@neondatabase/serverless";

const canteenRouter = new Hono<{ Bindings: Env }>();

canteenRouter.get("/", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);
  try {
    const result = await getAllCanteensWithSignatureMenus(db);
    if (result.length > 0) {
      return c.json({
        status: true,
        statusCode: 200,
        count: result.length,
        data: result,
      });
    }
    return c.json(
      { status: false, statusCode: 404, message: "canteen not found" },
      404
    );
  } catch (error) {
    return c.json(
      { status: false, statusCode: 500, message: "Internal server error" },
      500
    );
  }
});

canteenRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).max(255),
      imageUrl: z.string().url(),
    })
  ),
  async (c) => {
    const sql = neon(c.env.DATABASE_URL);
    const db = drizzle(sql);
    const { name, imageUrl } = c.req.valid("json");
    try {
      const res = await createCanteenRepo(db, {
        id: uuidv4(),
        name,
        imageUrl,
      });
      if (!res) {
        return c.json(
          { status: false, statusCode: 500, message: "Internal server error" },
          500
        );
      }
      return c.json(
        { status: true, statusCode: 201, message: "create canteen success" },
        201
      );
    } catch (error) {
      return c.json(
        { status: false, statusCode: 500, message: "Internal server error" },
        500
      );
    }
  }
);

canteenRouter.put(
  "/",
  zValidator(
    "json",
    z.object({
      id: z.string().min(1).max(100),
      name: z.string().min(1).max(100).nullable(),
      imageUrl: z.string().url().nullable().default(null),
    })
  ),
  async (c) => {
    const { id, name, imageUrl } = c.req.valid("json");
    const nameChecked = name ?? undefined;
    const sql = neon(c.env.DATABASE_URL);
    const db = drizzle(sql);

    try {
      const res = await updateCanteenRepo(db, id, {
        name: nameChecked,
        imageUrl,
      });
      if (res === null) {
        return c.json({ message: "update failed" }, 500);
      }
      return c.json(
        {
          status: true,
          statusCode: 200,
          message: "Update canteen success",
          data: res,
        },
        200
      );
    } catch (error) {
      console.error("Error updating canteen:", error);
      return c.json(
        { status: false, statusCode: 500, message: "Internal server error" },
        500
      );
    }
  }
);

canteenRouter.delete(
  "/:id",
  zValidator(
    "param",
    z.object({
      id: z.string().min(1).max(100),
    })
  ),
  async (c) => {
    const sql = neon(c.env.DATABASE_URL);
    const db = drizzle(sql);
    const { id } = c.req.valid("param");
    try {
      const res = await deleteCanteenRepo(db, id);
      if (!res) {
        return c.json({ message: "Canteen not found" }, 404);
      } else {
        return c.json(
          { status: true, statusCode: 200, message: "canteen deleted success" },
          200
        );
      }
    } catch (error) {
      return c.json(
        { status: false, statusCode: 500, message: "internal Server error" },
        500
      );
    }
  }
);

export default canteenRouter;