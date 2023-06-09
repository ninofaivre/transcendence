#!/bin/bash

readingData=false
data=""

function prettify
{
	echo -e "\e[31mDATA\e[0m"
	echo "$1" | json_pp | pygmentize -l json
	echo -e -n "\n\n"
}

while read -r line; do
	if echo "$line" | grep -e '^event' > /dev/null; then
		echo -e "\e[36mEVENT $(echo "$line" | cut -d ' ' -f 2-)\e[0m\n"
	fi
	if ! echo "$line" | grep -e '^data' > /dev/null && [ $readingData == false ]; then
		continue
	fi
	readingData=true
	if echo "$line" | grep 'data' > /dev/null; then
		data="$(echo "$line" | cut -d ' ' -f 2-)"
		continue
	fi
	if [ "$line" == "" ]; then
		readingData=false;
		prettify "$data"
		continue
	fi
	data="${data}${line}"
done
