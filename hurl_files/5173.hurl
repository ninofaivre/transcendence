# POST http://localhost:5173/api/auth/signup
# [Options]
# insecure: true
# {
#   "username": "alice",
#   "password": "password"
# }
# HTTP 201

POST http://localhost:5173/api/auth/login
[Options]
insecure: true
{
  "username": "alice",
  "password": "password"
}
HTTP 201

