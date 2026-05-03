/**
 * VoterPath Test Manifest Signer
 * Generates a valid RSA-SHA256 signature for the test environment.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// We'll generate a temporary key pair for signing in the test environment
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const factsPath = path.join(__dirname, '../backend/data/electionFacts.json');
const registryPath = path.join(__dirname, '../backend/config/trusted_registry.json');
const keysPath = path.join(__dirname, '../backend/config/authoritativeKeys.js');

const facts = fs.readFileSync(factsPath, 'utf8');
const hash = crypto.createHash('sha256').update(facts).digest('hex');

const signer = crypto.createSign('SHA256');
signer.update(facts);
signer.end();
const signature = signer.sign(privateKey, 'base64');

const registry = {
  manifest: {
    hash: hash,
    signature: signature,
    lastVerified: new Date().toISOString(),
    provider: "Election Commission Official Registry (TEST_AUTHORITY)",
    issuerId: "ECI-REGISTRY-V1",
    signedAt: new Date().toISOString(),
    expiresAt: "2027-05-01T00:00:00Z"
  }
};

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

const pubKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const keysContent = `/**
 * VoterPath Authoritative Public Keys (TEST ENVIRONMENT)
 */
const ECI_PUBLIC_KEY = \`${pubKeyPem}\`;

module.exports = { ECI_PUBLIC_KEY };
`;

fs.writeFileSync(keysPath, keysContent);

console.log('Test manifest signed successfully with temporary key pair.');
console.log('Public Key Fingerprint:', crypto.createHash('sha256').update(pubKeyPem).digest('hex'));
