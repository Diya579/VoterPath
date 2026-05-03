const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0AhTIZo1am2Es
tTcjLdqOsq3myXAmO4ZuSz6oS5I8dID66SfMdx26Oviy8/Yg0mhM3E3N8xSTn4gi
0p5I9JlUaTASEkTVcnih+to6Ixj7O+6cfVQg6RgU+HkhvZTiIYLVGzGjcDBqHlVo
hw3xiONzNhWppDqStBqy3JrOyQDnY1XtyJQP6lUbenq5+jo1HrvDynOL0ZwTjjcm
Firfr58xkqJW655O4n1wflf0iMFjPnRg+mwxOT0qauGo4daIhUY6QxidZkex1L+q
cSi85EQwgHC0xA94MOLmw/lReYX2hnk5zq3zJYq5aO1gH3Ck+Kldia1xM/EnKkPY
Md1GhvJHAgMBAAECggEASpz2Ol7vxpfTPrHaqfVOu4lqtdfXabGQtlTwItg4RGDS
Oa69NW5GXzQkdCDVa6NrYjiK84wHgm1FA5Ij0/+3MprrNwJlj8gEIrgVDrYPm8uq
yyjT31RfDAo2Q3sOpHDZhzXfbGyLVOE/67TXXb+s78uCTS/qq3aF/o+ch4wfmMkN
E5PAH19yc6YHYGcX/xUQboptt0DDGTWTEm3eZrK+t3/l3EJ17A25XHKGBpnHnnk9
Omk2r8brXnogYIgpsLsUoylZSz0SRGWGR8CGPyzp3OG4UIn2zSHnmickYhDdQsbY
BBXmtx2ImVHoKAsZwpR1eBJcX3lBHXDAdRxrZg40+QKBgQDY5xT4kbjxLGmNi1Rd
5eJICFlZETcZD+YdPD4psV4SjYt1DhxwwD5keDvETOxEf9Sne56lBKQruBNCMRKu
9VcW9P2H3U52LF4veMqmTULxZ7GCAClNoRssRSfJHBDkZIvIF9PZpt7wCHMmGIwp
oW+EbuhVBLjI1QfOVow11IUtwwKBgQDUdIKpm9g0TfqhG8beY/pA+pVMVZT+2C/0
ESuTyHa5A/nu1K9hSh0iU3mZMd77EmSJBNlXTaBM0Dy86VVu+xJQkoT+TCz9OZV8
cFlzS3Df8mGMKEyLjFjB6UDArzD639kPXOYUav7Oa51Dx3IWmzYQEnO6xeYCa7ss
k4QU1VkNLQKBgGwGqushqHp1JBzax6n8VDaL8fPqHwbcZD8rQcqCC9gxpsMlxARj
uq9PMnUR2ppDECZZ6ylEpn8frnfI+QUqK7XDToHcNrekYURDZKpu0GhqvH2Clw+S
rXXe+3GuCLu3V+bP9zLvaRkjHDZdA3G4dVH/6rZtI5rifoDFmg81SR8BAoGAQFbU
ZxbqH9TprLajwB+Y3urEIezdBVxlEU3N26Bey+L3YquIPTdboVSUQ5+FvpUwWwpb
44N/oyOA8VjcZZKlVj85BWX+TeWNbrT7cd4L3dYiUna1z6D+FCNWV8P2WlNGAdAJ
YW+RoOOYKbmRxGTWt4FPCOX7pQoJEhPOcRy3LjUCgYEAlZAqDCUXRUHhcYqZBy5b
7o21JADa7Gj/ApxRjJFXVvdR7tqsmNbEWRmZUUr5/L/nYVevsp9/CO8+EKRTnm05
/gaYs3UK18cCxA1pq58bDe93T9F5z0LycvHz2R8Oe0Qwmhi2YfVYhIcjDofaG21x
4R6X0ogC6VXiLJf8cwupiFI=
-----END PRIVATE KEY-----`;

const factsPath = 'backend/data/electionFacts.json';
const data = fs.readFileSync(factsPath, 'utf8');

const sign = crypto.createSign('SHA256');
sign.update(data);
sign.end();
const signature = sign.sign(privateKey, 'base64');

const registry = {
  manifest: {
    hash: crypto.createHash('sha256').update(data).digest('hex'),
    signature: signature,
    lastVerified: new Date().toISOString(),
    provider: "Election Commission Official Registry"
  }
};

fs.writeFileSync('backend/config/trusted_registry.json', JSON.stringify(registry, null, 2));
console.log('Trusted registry created and signed.');
