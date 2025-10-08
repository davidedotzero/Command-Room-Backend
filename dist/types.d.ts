export interface Task {
    taskID: string;
    projectID: string;
    taskName: string;
    teamID: number;
    deadline: Date;
    taskStatusID: number;
    logPreview: string;
    teamHelpID: number | null;
    helpReqAt: Date | null;
    helpReqReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface Project {
    projectID: string;
    projectName: string;
    isArchived: boolean;
}
export interface Team {
    teamID: number;
    teamName: string;
}
export interface TaskStatus {
    taskStatusID: number;
    taskStatusName: string;
}
export interface PoStatus {
    poStatusID: number;
    poStatusName: string;
}
export interface User {
    userID: string;
    userName: string;
    email: string;
    roleID: number;
    isAdmin: boolean;
}
export interface EditLog {
    eLogID: string;
    taskID: string;
    userID: string;
    date: Date;
    reason: string;
    fromStatusID: number | null;
    toStatusID: number | null;
    fromDeadline: Date | null;
    toDeadline: Date | null;
}
export interface FilteringTask extends Task {
    teamName: string;
    taskStatusName: string;
    teamHelpName: string;
    workers: User[];
    po: PO | null;
    customer: Customer | null;
}
export interface DetailedCustomer extends Customer {
    customerType: CustomerType;
}
export interface DetailedPO extends PO {
    poStatus: POStatus;
    customer: Customer;
}
export interface DefaultTaskName {
    taskName: string;
    teamID: number;
}
export interface TaskUser {
    taskID: string;
    userID: string;
}
export interface Customer {
    customerID: string;
    customerName: string;
    address: string;
    customerTypeID: number;
}
export interface CustomerType {
    customerTypeID: number;
    customerTypeName: string;
}
export interface PO {
    poID: string;
    customerID: string;
    taskID: string;
    poStatusID: number;
    poAttachmentID: string | null;
    createAt: Date;
}
export interface POStatus {
    poStatusID: number;
    poStatusName: string;
}
export interface CustomerUser {
    customerID: string;
    userID: string;
}
export interface Attachment {
    attachmentID: string;
    attachmentTypeID: number;
    link: string;
}
export interface AttachmentType {
    attachmentTypeID: number;
    attachmentTypeName: number;
}
export interface MaxIDS {
    task: number;
}
//# sourceMappingURL=types.d.ts.map