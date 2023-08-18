#!/bin/bash

accessToken=

function getAccessToken
{
	accessToken="$(awk '/access_token/{ print $NF }' "./cookies.${1}.txt")"
	if [ -z "$accessToken" ]; then
		echo "no access_token"; exit 2
	fi
}

getAccessToken "$@"

curl -N 'http://localhost:3000/api/users/@me'\
	-H "Authorization: Bearer ${accessToken}"
echo
echo

curl -N 'http://localhost:3000/api/users/@me/PP'\
	-X 'PUT'\
	-H "Authorization: Bearer ${accessToken}"\
	-F "profilePicture=@${2}"
