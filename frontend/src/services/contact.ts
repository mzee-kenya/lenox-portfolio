import { api } from "./api";

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
}

export async function sendMessage(payload: ContactPayload): Promise<{ id: number }> {
  const { data } = await api.post<{ ok: boolean; id: number }>("/contact/", payload);
  return { id: data.id };
}