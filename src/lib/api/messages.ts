import { apiClient } from "./client";
import type { ApiResponse } from "@/types";

export interface MessageThread {
  id: string;
  applicationId: string;
  applicationNumber: string;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  status: string;
  updatedAt: string;
  lastMessageAt: string;
  lastMessageSnippet: string;
  lastSenderRole?: "CLIENT" | "ADMIN" | null;
  subject: string;
  unreadCount: number;
  isStarred: boolean;
  totalMessages: number;
  latestChannel: "IN_APP" | "EMAIL" | "SMS";
  sendEmail: boolean;
  sendSms: boolean;
}

export interface ApplicationMessageItem {
  id: string;
  organizationId: string;
  applicationId: string;
  senderId: string;
  senderRole: "CLIENT" | "ADMIN";
  subject?: string;
  channel: "IN_APP" | "EMAIL" | "SMS";
  sendEmail: boolean;
  sendSms: boolean;
  emailMessageId?: string;
  smsMessageId?: string;
  isStarred: boolean;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  sender?: {
    id: string;
    email: string;
    role: "CLIENT" | "ADMIN";
  };
}

export interface SendMessagePayload {
  applicationId?: string;
  subject?: string;
  message: string;
  channel?: "IN_APP" | "EMAIL" | "SMS";
  sendEmail?: boolean;
  sendSms?: boolean;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export const messagesApi = {
  // Client: Fetch Gmail threads
  async getClientThreads(folder: string = "inbox", search: string = ""): Promise<MessageThread[]> {
    const res = await apiClient.get<ApiResponse<MessageThread[]>>("/client/messages/threads", {
      params: { folder, search },
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch threads");
    }
    return res.data.data;
  },

  // Client: Fetch messages in a thread
  async getClientThreadMessages(applicationId: string): Promise<ApplicationMessageItem[]> {
    const res = await apiClient.get<ApiResponse<ApplicationMessageItem[]>>(
      `/client/messages/${applicationId}/messages`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch messages");
    }
    return res.data.data;
  },

  // Client: Send message in thread or compose
  async sendClientMessage(payload: SendMessagePayload): Promise<ApplicationMessageItem> {
    const endpoint = payload.applicationId
      ? `/client/messages/${payload.applicationId}/messages`
      : `/client/messages/send`;
    const res = await apiClient.post<ApiResponse<ApplicationMessageItem>>(endpoint, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to send message");
    }
    return res.data.data;
  },

  // Admin: Fetch Gmail threads
  async getAdminThreads(folder: string = "inbox", search: string = ""): Promise<MessageThread[]> {
    const res = await apiClient.get<ApiResponse<MessageThread[]>>("/admin/messages/threads", {
      params: { folder, search },
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch threads");
    }
    return res.data.data;
  },

  // Admin: Fetch messages in a thread
  async getAdminThreadMessages(applicationId: string): Promise<ApplicationMessageItem[]> {
    const res = await apiClient.get<ApiResponse<ApplicationMessageItem[]>>(
      `/admin/messages/${applicationId}/messages`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch messages");
    }
    return res.data.data;
  },

  // Admin: Send message in thread or compose
  async sendAdminMessage(payload: SendMessagePayload): Promise<ApplicationMessageItem> {
    const endpoint = payload.applicationId
      ? `/admin/messages/${payload.applicationId}/messages`
      : `/admin/messages/send`;
    const res = await apiClient.post<ApiResponse<ApplicationMessageItem>>(endpoint, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to send message");
    }
    return res.data.data;
  },

  // Toggle star status on message
  async toggleStar(applicationId: string, messageId: string, isAdmin: boolean = false): Promise<any> {
    const prefix = isAdmin ? "/admin/messages" : "/client/messages";
    const res = await apiClient.post<ApiResponse<any>>(`${prefix}/${applicationId}/messages/${messageId}/star`);
    return res.data;
  },
};
