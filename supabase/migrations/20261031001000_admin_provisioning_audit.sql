-- The bootstrap runs with the server-only service role and writes an audit event.
grant insert on public.admin_audit_logs to service_role;
