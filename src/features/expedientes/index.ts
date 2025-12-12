export * from './domain';
export * from './service';
// repository contains direct db access, usually service is the public interface, but depending on FSD/project rules repository might be exported or not.
// core/expedientes export schema and service.
// We will export everything for now to facilitate migration.
export * from './repository';
