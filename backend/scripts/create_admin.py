import asyncio

from database.database import users_collection
from services.auth_service import hash_password
from config.settings import ADMIN_EMAIL, ADMIN_PASSWORD


# --------------------------------------------------
# Create / Update Admin User
# --------------------------------------------------

async def create_admin():

    email = ADMIN_EMAIL.strip().lower()

    # Check if admin already exists
    existing_user = await users_collection.find_one(
        {"email": email}
    )

    # Hash admin password
    hashed_password = hash_password(
        ADMIN_PASSWORD
    )

    # Admin user document
    admin_data = {
        "name": "Dharmika",
        "email": email,
        "hashed_password": hashed_password,
        "role": "admin"
    }

    # If admin exists, update it
    if existing_user:

        await users_collection.update_one(
            {"_id": existing_user["_id"]},
            {
                "$set": {
                    "name": "Dharmika",
                    "hashed_password": hashed_password,
                    "role": "admin"
                }
            }
        )

        print("Admin account updated successfully.")

    # Otherwise create new admin
    else:

        await users_collection.insert_one(
            admin_data
        )

        print("Admin account created successfully.")

    print(f"Admin email: {email}")
    print("Role: admin")


# --------------------------------------------------
# Run
# --------------------------------------------------

if __name__ == "__main__":
    asyncio.run(create_admin())