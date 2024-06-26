import { zValidator } from "@hono/zod-validator";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  createMenuRepo,
  deleteMenuRepo,
  getAllMenuRepo,
  updateMenuRepo,
} from "../repositories/menu.repository";
import { Env } from "../utils/config.env";
import { configDb } from "../db/config";

const menuRouter = new Hono<{ Bindings: Env }>();

menuRouter.get("/", async (c) => {
  try {
    const result = await getAllMenuRepo(c);
    if (result.length > 0) {
      return c.json({
        status: true,
        statusCode: 200,
        count: result.length,
        data: result,
      });
    }
    return c.json(
      { status: false, statusCode: 404, message: "menu not found" },
      404
    );
  } catch (error) {
    return c.json(
      { status: false, statusCode: 500, message: "internal server error" },
      500
    );
  }
});

menuRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).max(100),
      type: z.string().min(1).max(100),
      canteenId: z.string().min(1).max(100),
      price: z.number().min(1).max(1000000),
      signature: z.boolean().default(false),
      imageUrl: z.string().url().nullable(),
      description: z.string().min(1).max(100).nullable(),
    })
  ),
  async (c) => {
    const { name, imageUrl, type, canteenId, price, description, signature } =
      c.req.valid("json");
    try {
      const res = await createMenuRepo(c, {
        name,
        type,
        canteenId,
        price,
        signature,
        imageUrl,
        description,
      });
      if (!res) {
        return c.json({ message: "Internal server error" }, 500);
      }
      return c.json(
        { status: true, statusCode: 201, message: "create menu success" },
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

menuRouter.put(
  "/",
  zValidator(
    "json",
    z.object({
      id: z.string().min(1).max(256),
      name: z.string().optional(),
      type: z.string().optional(),
      price: z.number().optional(),
      signature: z.boolean().optional(),
      imageUrl: z.string().url().optional(),
      description: z.string().optional(),
    })
  ),
  async (c) => {
    const { id, name, type, price, signature, imageUrl, description } =
      c.req.valid("json");
    const nameChecked = name ?? undefined;
    const typeChecked = type ?? undefined;
    const priceChecked = price ?? undefined;
    const signatureChecked = signature ?? undefined;
    const imageUrlChecked = imageUrl ?? undefined;
    const descriptionChecked = description ?? undefined;

    try {
      const res = await updateMenuRepo(c, id, {
        name: nameChecked,
        type: typeChecked,
        price: priceChecked,
        signature: signatureChecked,
        imageUrl: imageUrlChecked,
        description: descriptionChecked,
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

menuRouter.delete(
  "/:id",
  zValidator(
    "param",
    z.object({
      id: z.string().min(1).max(100),
    })
  ),
  async (c) => {
    const { id } = c.req.valid("param");
    try {
      const res = await deleteMenuRepo(c, id);
      if (!res) {
        return c.json(
          { status: false, statusCode: 404, message: "menu not found" },
          404
        );
      } else {
        return c.json(
          { status: true, statusCode: 200, message: "menu deleted success" },
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

export default menuRouter;
