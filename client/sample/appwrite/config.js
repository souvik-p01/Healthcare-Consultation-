import conf from "../conf/conf";
import { Client, ID, Databases, Storage, Query } from "appwrite";

export class Service {
  client = new Client();
  databases; // Fixed property name
  bucket;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);
    this.databases = new Databases(this.client); // Fixed syntax
    this.bucket = new Storage(this.client); // Fixed syntax
  }

  async createPost({ title, slug, content, featuredImage, status, userId }) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId, // Fixed typo (assuming it should be CollectionId)
        slug,
        {
          title,
          content,
          featuredImage,
          status,
          userId,
        }
      );
    } catch (error) {
      console.log("Appwrite service :: createPost :: error", error); // Fixed error message
      return false;
    }
  } // Added missing closing brace

  async updatePost(slug, { title, content, featuredImage, status }) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId, // Fixed typo
        slug,
        {
          title,
          content,
          featuredImage,
          status,
        }
      );
    } catch (error) {
      console.log("Appwrite service :: updatePost :: error", error); // Fixed error message
      return false;
    }
  }

  async deletePost(slug) {
    try {
      await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId, // Fixed typo
        slug
      );
      return true;
    } catch (error) {
      console.log("Appwrite service :: deletePost :: error", error); // Fixed error message
      return false;
    }
  }

  async getPost(slug) {
    try {
      return await this.databases.getDocument( // Fixed method name
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId, // Fixed typo
        slug
      );
    } catch (error) {
      console.log("Appwrite service :: getPost :: error", error); // Fixed error message
      return false;
    }
  }

  async getPosts(queries = [Query.equal("status", "active")]) {
    try {
      return await this.databases.listDocuments( // Fixed method call
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId, // Fixed typo
        queries
      );
    } catch (error) {
      console.log("Appwrite service :: getPosts :: error", error); // Fixed error message
      return false;
    }
  }

  // File upload service
  async uploadFile(file) {
    try {
      return await this.bucket.createFile(
        conf.appwriteBucketId,
        ID.unique(),
        file
      );
    } catch (error) {
      console.log("Appwrite service :: uploadFile :: error", error); // Fixed error message
      return false;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.bucket.deleteFile(conf.appwriteBucketId, fileId);
      return true;
    } catch (error) {
      console.log("Appwrite service :: deleteFile :: error", error); // Fixed error message
      return false;
    }
  }

  getFilePreview(fileId) {
    return this.bucket.getFilePreview(conf.appwriteBucketId, fileId); // Fixed method name
  }
}

const service = new Service();
export default service;