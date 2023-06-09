#!/bin/bash

if [ "$#" != "2" ]; then
	echo "bad arguments number" 1>&2; exit 1
fi

accessToken=

function getAccessToken
{
	accessToken="$(awk '/access_token/{ print $NF }' "./cookies.${2}.txt")"
	if [ -z "$accessToken" ]; then
		echo "no access_token"; exit 2
	fi
}

curlCmd=
retry=false
if [ "$1" == "https" ]; then
	curlCmd='curl -s -N --http2 $([ $retry == false ] && echo "-v") -k --cookie "./cookies.${2}.txt" -H "Accept:text/event-stream" "https://localhost:3000/api/sse"'
elif [ "$1" == "http" ]; then
	curlCmd='"curl" -s -N $([ $retry == false ] && echo "-v") -H "Accept:text/event-stream" -H "Authorization: Bearer ${accessToken}" "http://localhost:3000/api/sse"'
else
	echo "invalid value : ${1}, only [http, https] are valid values"
fi

getAccessToken "$@"
while true; do
	echo -e "$([ $retry == true ] && echo "\n")\033[0;34m${2^^}\033[0m\n"
	eval "$curlCmd | ./prettifyJson.sh"
	sleep 2
	retry=true
	clear
done
