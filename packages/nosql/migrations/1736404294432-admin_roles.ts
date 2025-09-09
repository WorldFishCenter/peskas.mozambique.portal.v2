import getModels from "./connect";

export async function up (): Promise<void> {
  const { UserModel, GroupModel, PermissionModel} = await getModels();

  const adminPerm = await PermissionModel.findOne({name: "Admin Permission"})
  if (adminPerm) {
    await PermissionModel.findOneAndUpdate({
      _id: adminPerm._id,
      },
      {
        domain: [
          ...adminPerm.domain,
          {
            country: "",
            resource: "user",
            actions: ['create', 'read', 'update', 'delete'],
          }
        ],
      },
    )  
  }

  const adminGroup = await GroupModel.findOne({name: "Admin"})
  const adminUsers = await UserModel.find({email: { $in: ['anthony@mountaindev.com', 'declan@mountaindev.com'] }})
  adminUsers.map(async (adminUser) => {
    await UserModel.findOneAndUpdate({
        _id: adminUser._id,
      },
      {
        groups: [adminGroup?._id],
      },
    )
  })  

  
}

export async function down (): Promise<void> {
  // Write migration here
}
