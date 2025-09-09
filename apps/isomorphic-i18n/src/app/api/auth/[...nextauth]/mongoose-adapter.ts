import mongoose, { type ObjectId } from "mongoose";
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters";

import getDb from "@repo/nosql";
import {
  AccountModel,
  SessionModel,
  UserModel,
  VerificationTokenModel,
} from "@repo/nosql/schema/auth";

export const format = {
  /** Takes a MongoDB object and returns a plain old JavaScript object */
  from<T = Record<string, unknown>>(object: Record<string, any>): T {
    const newObject: Record<string, unknown> = {};
    for (const key in object) {
      if (key === "_id" && object[key] instanceof mongoose.Types.ObjectId) {
        newObject.id = object[key].toHexString();
      } else if (
        key === "userId" &&
        object[key] instanceof mongoose.Types.ObjectId
      ) {
        newObject[key] = object[key].toHexString();
      } else {
        newObject[key] = object[key];
      }
    }
    return newObject as T;
  },

  /** Takes a plain old JavaScript object and turns it into a MongoDB object */
  to<T = Record<string, unknown>>(object: Record<string, any>) {
    const newObject: Record<string, unknown> = {
      _id: _id(`${object.id}`),
    };
    for (const key in object) {
      if (key === "userId") newObject[key] = _id(`${object[key]}`);
      else if (key === "id") continue;
      else newObject[key] = object[key];
    }
    return newObject as T & { _id: ObjectId };
  },
};

/** @internal */
export function _id(hex?: string) {
  if (hex?.length !== 24) return new mongoose.Types.ObjectId();
  return new mongoose.Types.ObjectId(hex);
}

export function MDMongooseAdapter(): Adapter {
  const { from, to } = format;

  return {
    async createUser(data: any) {
      await getDb();
      const user = await UserModel.create(data);
      return from<AdapterUser>(user);
    },
    async getUser(id) {
      await getDb();
      const user = await UserModel.findById(id).lean();
      if (!user) return null;

      return from<AdapterUser>(user);
    },
    async getUserByEmail(email) {
      await getDb();
      const user = await UserModel.findOne({ email: email }).lean();
      if (!user) return null;
      user.id = user?._id.toString();

      return from<AdapterUser>(user);
    },
    async createSession(data) {
      await getDb();
      const session = to<AdapterSession>(data);
      await SessionModel.create(session);

      return from<AdapterSession>(session);
    },
    async getSessionAndUser(sessionToken) {
      await getDb();
      const session = await SessionModel.findOne({
        sessionToken: sessionToken,
      }).lean();
      if (!session) return null;

      const user = await UserModel.findById({
        _id: new mongoose.Types.ObjectId(session.userId),
      }).lean();
      if (!user) return null;

      return {
        user: from<AdapterUser>(user),
        session: from<AdapterSession>(session),
      };
    },
    async updateUser(data) {
      await getDb();
      const { _id, ...user } = to<AdapterUser>(data);
      const result = await UserModel.findByIdAndUpdate(
        _id,
        { user },
        { new: true }
      ).exec();
      return from<AdapterUser>(result!);
    },
    async updateSession(data) {
      await getDb();
      const session = await SessionModel.findOneAndUpdate({
        sessionToken: data.sessionToken,
        expires: data.expires,
      });

      return from<AdapterSession>(session!);
    },
    async linkAccount(data: any) {
      await getDb();
      const account = await AccountModel.create(data);

      return from<AdapterAccount>(account);
    },
    async getUserByAccount(data) {
      await getDb();
      const account = await AccountModel.findOne(data);
      if (!account) return null;
      const user = await UserModel.findById(account.userId).lean();
      if (!user) return null;

      return from<AdapterUser>(user);
    },
    async deleteSession(sessionToken) {
      await getDb();
      const session = await SessionModel.findOneAndDelete({
        sessionToken: sessionToken,
      });

      return from<AdapterSession>(session!);
    },
    async createVerificationToken(token) {
      await getDb();
      const verificationToken = await VerificationTokenModel.create(token);

      return from<VerificationToken>(verificationToken);
    },
    async useVerificationToken(token) {
      await getDb();
      const verificationToken =
        await VerificationTokenModel.findOneAndDelete(token).lean();
      if (!verificationToken) return null;
      const { _id, ...rest } = verificationToken;
      return from<VerificationToken>(rest);
    },
    async deleteUser(id) {
      await getDb();
      await Promise.all([
        AccountModel.deleteMany({ userId: id }),
        SessionModel.deleteMany({ userId: id }),
        UserModel.findByIdAndDelete({ _id: new mongoose.Types.ObjectId(id) }),
      ]);
    },
    async unlinkAccount(data: any) {
      await getDb();
      const account = await AccountModel.findOneAndDelete(data);
      return from<AdapterAccount>(account!);
    },
  };
}
