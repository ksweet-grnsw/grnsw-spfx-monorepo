export interface IApiConfig {
  dataverseClientId: string;
  dataverseClientSecret: string;
  tenantId: string;
  graphApiEndpoint: string;
  scope: string[];
}

export const apiConfig: IApiConfig = {
  dataverseClientId: "3e9eb05b-3a09-4a77-8b2b-9a714ab84e12",
  dataverseClientSecret: process.env.DATAVERSE_CLIENT_SECRET || "",
  tenantId: "78247cd5-7ce6-4361-bd6c-cadfc9f8f547",
  graphApiEndpoint: "https://graph.microsoft.com/v1.0",
  scope: ["https://graph.microsoft.com/.default"]
};

export const dataverseConfig = {
  environment: "https://org98489e5d.crm6.dynamics.com",
  apiVersion: "v9.2",
  tableName: "cr4cc_weatherdatas" // Note: Use the Entity Set Name (plural form)
};