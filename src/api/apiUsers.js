import express from "express";
import { Clerk } from "@clerk/clerk-sdk-node";
import { createClerkClient } from "@clerk/backend";

const app = express();
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Initialize Clerk client using the secret key
const clerk = Clerk({ apiKey: process.env.CLERK_SECRET_KEY });

export async function getUserList(options = {}) {
  try {
    const users = await clerkClient.users.getUserList(options);
    return users;
  } catch (error) {
    console.error("Error fetching user list:", error);
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    const user = await clerkClient.users.getUser(userId);
    return user;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
}

export async function updateUserMetadata(userId, data) {
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      portfolioLink: data.portfolioLink,
      linkedIn: data.linkedIn,
      industryExperience: data.industryExperience,
      levelOfExperience: data.levelOfExperience,
      areaOfSpecialization: data.areaOfSpecialization,
    },
    privateMetadata: {
      resumeUrl: data.resumeUrl,
    },
  });
}

export async function deleteUser(userId) {
  try {
    await clerkClient.users.deleteUser(userId);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
}
