// Typed calls to the backend API (paths relative to siteConfig.apiBasePath).
import { api, type Page } from "./client";

export type Role = {
    id: number;
    x_id: string;
    name: string;
    status: number;
    remark?: string | null;
    created_time: string;
    updated_time?: string | null;
};

export type User = {
    id: number;
    x_id: string;
    firstname?: string | null;
    lastname?: string | null;
    phone?: string | null;
    email?: string | null;
    status?: boolean;
    join_time?: string;
    last_login_time?: string | null;
    roles?: { name: string }[] | null;
};

export type LoginResult = {
    access_token: string;
    access_token_expire_time: string;
    user: User;
    is_new_user?: boolean;
};

export type OtpRequestResult = {
    sent: boolean;
    phone: string;
    expires_in: number;
    resend_in: number;
};

export type LoginLog = {
    id: number;
    user_x_id: string;
    email: string;
    status: number;
    ip: string;
    browser?: string | null;
    os?: string | null;
    msg: string;
    login_time: string;
};

export type OperaLog = {
    id: number;
    trace_id: string;
    user_email?: string | null;
    method: string;
    title: string;
    path: string;
    ip: string;
    status: number;
    code: string;
    msg?: string | null;
    cost_time: number;
    opera_time: string;
};

export type PageQuery = { page?: number; size?: number } & Record<
    string,
    string | number | boolean | undefined
>;

export const authApi = {
    login: (email: string, password: string) =>
        api<LoginResult>({ method: "POST", url: "/auth/login", data: { email, password } }),
    register: (email: string, password: string) =>
        api<LoginResult>({ method: "POST", url: "/auth/register", data: { email, password } }),
    requestOtp: (phone: string) =>
        api<OtpRequestResult>({ method: "POST", url: "/auth/whatsapp/request-otp", data: { phone } }),
    verifyOtp: (phone: string, code: string) =>
        api<LoginResult>({ method: "POST", url: "/auth/whatsapp/verify-otp", data: { phone, code } }),
    me: () => api<User>({ method: "GET", url: "/auth/me" }),
    updateMe: (data: { firstname?: string; lastname?: string }) =>
        api<null>({ method: "PATCH", url: "/auth/me", data }),
    logout: () => api<null>({ method: "POST", url: "/auth/logout" }),
};

export const adminApi = {
    users: (params: PageQuery) => api<Page<User>>({ method: "GET", url: "/user/", params }),
    roles: (params: PageQuery) => api<Page<Role>>({ method: "GET", url: "/role/", params }),
    allRoles: () => api<Role[]>({ method: "GET", url: "/role/all" }),
    createRole: (data: { name: string; status: number; remark?: string | null }) =>
        api<null>({ method: "POST", url: "/role/", data }),
    updateRole: (pk: number, data: { name: string; status: number; remark?: string | null }) =>
        api<null>({ method: "PUT", url: `/role/${pk}`, data }),
    deleteRoles: (pk: number[]) =>
        api<null>({
            method: "DELETE",
            url: "/role/",
            params: { pk },
            paramsSerializer: { indexes: null },
        }),
    loginLogs: (params: PageQuery) =>
        api<Page<LoginLog>>({ method: "GET", url: "/login_log/", params }),
    operaLogs: (params: PageQuery) =>
        api<Page<OperaLog>>({ method: "GET", url: "/opera_log/", params }),
};

export function isAdmin(user: User | null | undefined): boolean {
    return !!user?.roles?.some(r => r.name === "admin");
}

export function displayName(user: User | null | undefined): string {
    if (!user) return "";
    const full = [user.firstname, user.lastname].filter(Boolean).join(" ");
    return full || user.email || (user.phone ? `+${user.phone}` : "User");
}
