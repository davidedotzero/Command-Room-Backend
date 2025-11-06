export interface UserUnseenCount {
    userID: string,
    unseenCount: number
};

// TODO: will change this when i know what fields are supposed to be in projectTask
// TODO: add preview log field
export interface Task {
    taskID: string,
    projectID: string,
    taskName: string,
    teamID: number, //Team: teamID
    deadline: Date,
    taskStatusID: number, //TaskStatus: statusID
    logPreview: string // this should be the "description" of the latest log for the task
    teamHelpID: number | null, //Team: teamID
    helpReqAt: Date | null,
    helpReqReason: string | null,
    createdAt: Date,
    updatedAt: Date,
};

export interface Project {
    projectID: string;
    projectName: string;
    isArchived: boolean;
}

export interface Team {
    teamID: number,
    teamName: string,
}

export interface TaskStatus {
    taskStatusID: number,
    taskStatusName: string,
}

export interface PoStatus {
    poStatusID: number,
    poStatusName: string,
}

export interface User {
    userID: string;
    userName: string;
    email: string;
    teamID: number;
    isAdmin: boolean;
}

export interface EditLog {
    eLogID: string;
    taskID: string; // Task: taskID
    userID: string; // UseR: userID
    date: Date;
    reason: string;
    fromStatusID: number | null;
    toStatusID: number | null;
    fromDeadline: Date | null;
    toDeadline: Date | null;
}

// Task[] after joining with necessary tables
export interface FilteringTask extends Task {
    teamName: string; // Team: teamName
    taskStatusName: string; // TaskStatus: taskStatusName
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

// format PREFIX-YYYYMMDD-XXXXXX
// PROJ-20251001-000001
// TASK-20251001-000001
export interface MaxIDS {
    task: number;
}
