import type { AppUseCase, RolePolicy } from "@greenplus/supabase-shared/accessPolicy";

export interface ClientUseCaseCardModel {
  key: string;
  title: string;
  description: string;
  tables: string[];
  tableCount: number;
}

export interface CustomerPolicySummaryModel {
  role: RolePolicy["role"];
  description: string;
  queryTables: string[];
  mutationTables: string[];
}

export interface ClientFrontendPolicyModel {
  useCases: ClientUseCaseCardModel[];
  customerPolicy: CustomerPolicySummaryModel | null;
  visibleTables: string[];
}

class AccessPolicyAdapter {
  static toClientFrontendPolicyModel({
    useCases,
    customerPolicy,
    visibleTables,
  }: {
    useCases: AppUseCase[];
    customerPolicy?: RolePolicy;
    visibleTables: string[];
  }): ClientFrontendPolicyModel {
    const mappedUseCases = useCases.map((item) => ({
      key: item.key,
      title: item.title,
      description: item.description,
      tables: [...item.tables].sort(),
      tableCount: item.tables.length,
    }));

    const queryTables = customerPolicy?.tableAccess.select ?? [];
    const mutationTables = [
      ...(customerPolicy?.tableAccess.insert ?? []),
      ...(customerPolicy?.tableAccess.update ?? []),
      ...(customerPolicy?.tableAccess.delete ?? []),
    ];

    return {
      useCases: mappedUseCases,
      customerPolicy: customerPolicy
        ? {
            role: customerPolicy.role,
            description: customerPolicy.description,
            queryTables: [...new Set(queryTables)].sort(),
            mutationTables: [...new Set(mutationTables)].sort(),
          }
        : null,
      visibleTables: [...new Set(visibleTables)].sort(),
    };
  }
}

export default AccessPolicyAdapter;
