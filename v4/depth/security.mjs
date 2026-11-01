import {p,code,table,qa,refs,section,warn} from '../lesson-helpers.mjs';
export const securityDepth=[
{after:'validation',...section('resource-policy','Authorize the resource transition',
p('A valid token establishes claims under its issuer/validation contract. A refund still needs a resource decision: may this actor refund this order, in this tenant, for this amount, in its current state? A broad refund scope is one input. It does not establish order ownership, remaining refundable value or the actor’s current delegated authority.')+
code(`Conceptual application boundary, not a complete Spring service:
  actor = authenticatedPrincipal()     // never a caller's actorId field
  tenant = authorizedTenant(actor, requestedTenantContext)
  order = orders.findWithinTenant(tenant, orderId)
  require permission(actor, "refund", order, requestedAmount)
  perform an atomic allowed transition / refund-intent reservation
  persist original command identity + durable provider intent

Every alternate path (batch, support tool, consumer) must enforce its
own authorized transition. Hiding the button in the UI is not a policy.`)+
p('Apply tenant scoping to the lookup itself, not only to a later response filter. An unscoped lookup can leak existence through errors, timing or logs even if a later check rejects the body. Choose a consistent disclosure policy for absent versus unauthorized resources. HTTP status selection does not replace the underlying permission check.')+
code(`-- Illustrative PostgreSQL transition predicate, bound parameters.
UPDATE customer_order
SET state = 'REFUND_PENDING', version = version + 1
WHERE tenant_id = :authorized_tenant
  AND id = :order_id
  AND version = :observed_order_version
  AND state = 'PAID';
-- Require the expected result and create the refund intent/command
-- record in this local transaction. Amount/accounting rules also apply.`)+
p('This simplified full-refund transition is not a partial-refund ledger. For concurrent partial refunds, reserve the refundable amount atomically with the intended identity; two individually allowed amounts must not jointly exceed the charge. If policy depends on mutable membership or delegation, define when it is observed and how tightly revocation must take effect. An earlier Java check followed by a later mutation can race a revocation or resource-state change.')+
p('A version predicate protects the observed order state; it does not freeze an independently stored permission record. Strict revocation at the mutation boundary needs an authority/serialization protocol covering the relevant policy facts, or a deliberately documented decision-freshness contract. If authorization is a remote service, its successful response is not automatically enlisted in the local SQL transaction.')+
table(['Case','Required decision'],[['Known order ID from another tenant','Deny access through every lookup/mutation/export path.'],['Same tenant, wrong resource owner','Apply resource relationship policy, not tenant membership alone.'],['Correct actor, old order version','Re-evaluate the permitted transition; do not force the write.'],['Support operator','Use explicit limited privilege, purpose and audit trail.'],['Duplicate refund command','Resolve original authorized intention without a second amount reservation.']])+
qa([['Advanced','Does @PreAuthorize make a refund transaction safe by itself?','No. It can enforce an application policy at an intercepted boundary, but tenant scoping, mutable policy freshness, concurrent amount/state invariants, commit behavior and remote-effect identity remain separate obligations.'],['Intermediate','Can the tenant header select any tenant if the JWT is valid?','Only after authorization establishes that this actor may act in that requested tenant context. A header is a selector/request, not proof of entitlement.']])+
refs([['https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html','OWASP authorization guidance','default denial and resource/action permission checks.']]))},
{after:'concepts',...section('tenant-boundaries','Carry tenant identity safely',
p('Tenant isolation is an end-to-end data-flow property. A correctly filtered controller can still leak through a shared cache, an export job, a message consumer or an object-storage link. Trace one order from authenticated request to database, cache, outbox, worker and download. At each boundary identify where the tenant came from and which actor/service is permitted the intended action.')+
table(['Boundary','Identity source and check','Common failure'],[['Database query','Authorized tenant plus resource predicates','findById used on an untrusted global ID.'],['Cache reuse','Key/representation scoped to authorized context','Tenant A’s value returned under a shared product/order key.'],['Queued job','Authenticated producer path and authorized service operation','Treating a payload tenant field as proof of permission.'],['Export object','Tenant-owned job/object mapping and download policy','Guessable object key or unscoped pre-signed capability.'],['Logs/support search','Controlled access and minimal identifiers','Putting complete private payloads into a shared log index.']])+
code(`Illustrative event envelope, not authorization by itself:
  eventId: E91
  tenantId: T7
  aggregateId: O7
  operation: refund.requested
  schemaVersion: 2
  producerIdentity: established by transport/service authentication

The consumer validates the trusted producer path, schema and allowed
operation, then scopes its own resource access to T7/O7. Copying an
actor string into JSON does not grant that actor's live permissions.`)+
p('A background workflow may intentionally act under a service capability after the original user’s session ends. State that delegation model and its limits. Alternatively, an operation may require current user authority when executed, in which case queued delay and revocation require another check. Do not accidentally choose one model because the worker happens to have a powerful database credential.')+
p('Row-level security or separate databases can add isolation boundaries, but inspect their actual enforcement. A privileged database role may bypass some policies; connection-pool context can leak if session state is not reset. A tenant routing directory must also be protected: directing a valid tenant request to the wrong database can defeat correct row predicates if identities overlap. Defense in depth needs distinct failure assumptions, not repeated trust in the same unchecked header.')+
p('Signed object URLs are capabilities under their scope and expiry. They may remain usable after the browser session changes unless the delivery system supports a stronger revocation path. Bind issuance to an authorized job/object identity, choose a bounded lifetime and avoid exposing the URL in logs or referrers. A secret-looking filename alone is not access control.')+
p('Build a negative test matrix using fixtures from two tenants and at least two roles. Try another tenant’s resource ID in detail, list, mutation, export, search and replay paths, with warm caches and reused pooled connections. Confirm both denied actions and absent cross-tenant disclosure. Positive tests for the intended owner are necessary too; a system that denies everything has not demonstrated a usable policy.')+
qa([['Advanced','Why can a background job need authorization even when it was created by a checked API?','The stored request can be stale, malformed, replayed or routed through another producer. The worker needs a defined delegation/service authority, tenant-scoped access and current-state checks appropriate to its operation.'],['Intermediate','Is including tenantId in every log message sufficient isolation?','No. Logs need access controls, data minimization, retention and safe query tools. A tenant label helps correlation but does not prevent another tenant or broadly privileged operator reading private content.']]))},
{after:'implementation',...section('key-rotation','Validate tokens through rotation',
p('JWT verification is a policy over issuer, intended audience, allowed algorithms/keys and time constraints, followed by resource authorization. Merely decoding Base64 claims proves nothing about who issued them. The key identifier is untrusted input used to select among trusted issuer keys; it must not turn an arbitrary token-supplied URL into a place from which the service fetches its trust material.')+
code(`# Illustrative Spring resource-server issuer configuration.
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://identity.example.invalid/issuer

# Configure audience and algorithm restrictions through the supported
# properties/validators for the chosen Spring version and issuer.
# issuer-uri alone is not the application's complete resource policy.`)+
p('Use the framework’s supported decoder and validators rather than a homegrown signature parser. Verify the intended audience explicitly under the selected configuration. Keep signature, issuer and time checks when adding custom validators; replacing a validator chain with only an audience predicate can accidentally drop other checks. Token scopes/claims then map into a deliberate application permission model.')+
table(['Planned signing-key phase','Issuer action','Resource-server obligation'],[['Publish new public key','Make the next verification key discoverable','Refresh through the trusted issuer path under bounded behavior.'],['Start signing new tokens','Use new kid/key while old tokens can still be valid','Accept the permitted overlap and reject unknown/untrusted keys safely.'],['Drain old token lifetime','Stop issuing with old key; retain required verification history','Account for last issuance, allowed lifetime and clock tolerance.'],['Retire old key','Remove after the permitted overlap, unless emergency policy differs','Converge key caches and verify old signatures are no longer accepted as intended.']])+
p('For illustration, a maximum 15-minute access-token lifetime does not mean “remove the old key 15 minutes after publishing the new key.” Start from the last token issued with the old key and include the supported clock-tolerance/refresh policy. Test verifier behavior when the new kid first appears, the issuer is temporarily unavailable and old keys disappear. Unknown-kid traffic must not cause unbounded outbound discovery or disable validation.')+
p('Emergency compromise is a different procedure. Continuing to trust a stolen signing key until every token naturally expires may be unacceptable. Define how trust is revoked, how verifier caches converge and whether sessions/tokens are invalidated or reauthenticated. Short token lifetimes reduce an exposure window but do not create instantaneous revocation by themselves. Preserve a bounded, understood failure mode when the identity provider cannot be reached.')+
p('Database/API secret rotation has another lifecycle: provision a new credential, distribute it securely, verify new connections/requests, drain or replace old users, then revoke the old credential under the service’s actual session semantics. Updating a secret file does not prove an existing connection pool stopped using the old credential, nor that already-authenticated sessions were terminated. Keep least privilege and a rollback plan that does not re-expose a compromised secret.')+
qa([['Advanced','Should I disable signature validation temporarily if JWKS refresh fails during a release?','No. Keep the defined trust policy and bounded failure behavior. Rehearse key overlap, trusted cache behavior and issuer outage before rotation; validation bypass converts an availability incident into an authorization failure.'],['Intermediate','Does a JWT exp claim prove the user still owns this order?','No. It bounds token validity under the issuer/time policy. Current resource ownership, delegation and revocation requirements still govern the requested action.']])+
refs([['https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html','Spring JWT resource server','trusted decoding, issuer validation and key discovery.'],['https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html','OWASP secrets guidance','credential lifecycle and rotation.']]))},
{after:'worked',...section('webhook-replay','Authenticate and deduplicate callbacks',
p('A payment callback needs two protections: evidence that the message came through the expected authenticated contract, and a repeat-safe business transition. The following self-contained Java helper demonstrates an illustrative HMAC-SHA256 protocol over timestamp + a dot + raw body bytes. It is not a claim about any particular provider’s wire format. Implement the actual provider specification, including canonicalization, key selection and allowed clock window.')+
code(`static boolean verifyCallback(byte[] secret, String timestamp,
    byte[] rawBody, String signatureBase64, long nowSeconds)
    throws java.security.GeneralSecurityException {
  if (secret == null || secret.length < 32 || rawBody == null
      || rawBody.length > 1_048_576 || timestamp == null
      || !timestamp.matches("[0-9]{1,12}")
      || signatureBase64 == null || signatureBase64.length() > 128) {
    return false;
  }
  long sent = Long.parseLong(timestamp); // regex bounds fit in long
  if (sent < nowSeconds - 300 || sent > nowSeconds + 30) return false;
  byte[] supplied;
  try { supplied = java.util.Base64.getDecoder().decode(signatureBase64); }
  catch (IllegalArgumentException invalid) { return false; }
  if (supplied.length != 32) return false;
  javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
  mac.init(new javax.crypto.spec.SecretKeySpec(secret, "HmacSHA256"));
  mac.update((timestamp + ".").getBytes(java.nio.charset.StandardCharsets.UTF_8));
  byte[] expected = mac.doFinal(rawBody);
  return java.security.MessageDigest.isEqual(expected, supplied);
}`)+
p('The five-minute past window, 30-second future tolerance and one-megabyte body limit are illustrative policy choices. Use a trusted server clock and monitor skew. Bound the incoming body while reading it, before allocating an arbitrary payload; the helper’s length check is not an HTTP streaming limit. Preserve exact raw bytes until signature verification. Parsing and reserializing JSON can change whitespace/order and invalidate the signed representation.')+
p('The shared secret is a random key with adequate entropy, stored through the intended secret-management path, not a password or a client-provided header. A valid tag authenticates the bytes under possession of that key; it does not prove the business transition is allowed. After verification, parse the schema, locate the original payment/order, validate amount/currency/provider references and enforce the permitted conditional transition.')+
code(`Durable callback application outline:
  verify transport/signature contract and bounded timestamp
  parse validated event identity and business references
  begin local transaction
  claim provider + event identity; compare immutable content on repeat
  apply only the permitted original-intention state transition
  insert next-step outbox intent if that transition wins
  commit receipt + effect + next intent together
  return the provider's required acknowledgement

A lost acknowledgement can cause redelivery. Keep original identities.`)+
p('A signed request can be replayed within the allowed timestamp window. The verifier intentionally does not remember event IDs; durable deduplication belongs with the local effect. Concurrent duplicate callbacks and a polling reconciler can also race. Use conditional transitions and durable original-intention identity, not an in-memory set that disappears on restart. A reused event ID carrying different authenticated content is a conflict to investigate.')+
p('If legitimate delivery retries arrive outside the illustrative window, follow the actual provider’s supported retry/signature/inquiry contract. Do not silently widen the window forever to make errors disappear. Retained event receipts, authenticated inquiry and an authorized recovery operation can have different policies from live callback acceptance. A compromised shared secret requires a defined rotation/revocation procedure, not only duplicate filtering.')+
qa([['Advanced','If signature verification passes, may I immediately mark the order PAID?','No. Bind the callback to the expected provider intention, tenant, amount, currency and allowed state transition. Record it atomically with repeat-safe effects and handle contradictory or late outcomes through reconciliation.'],['Intermediate','Why compare the raw HMAC bytes with MessageDigest.isEqual?','Use the platform’s comparison designed for digest bytes rather than ordinary string equality for the tag. Bound/decode the supplied tag first, while keeping the entire verification and business protocol correct.']])+
refs([['https://docs.oracle.com/en/java/javase/21/docs/api/java.base/javax/crypto/Mac.html','JDK Mac API','HMAC computation.'],['https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html','JDK digest comparison','digest byte comparison API.']]))}
];
