import { Suspense } from "react";

import { api } from "@/trpc/server";

import { UserTable } from "./user-table";
import { AddUserButton } from "./add-user-button";

export default async function UsersPage() {
  const users = await api.user.all();
  
  return (
    <div>
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex flex-row items-center justify-start gap-2">
          <AddUserButton />
        </div>
      </div>      
      <Suspense fallback={<div>Loading...</div>}>
        <UserTable users={users} />
      </Suspense>      
    </div>
  )
}