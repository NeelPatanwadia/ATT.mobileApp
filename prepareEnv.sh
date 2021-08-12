#!/bin/bash
check_flags() 
{
  if [ "$1" != "--stage" ]; then
    echo "Usage: ./prepareEnv.sh --stage <STAGE_NAME>"
    exit 1
  fi

  case $2 in
      austindev ) 
        prepare_env "$2";;
      awrileydev )
        prepare_env "$2";;
      taylordev ) 
        prepare_env "$2";;
      crossdev ) 
        prepare_env "$2";;
      neeldev )
        prepare_env "$2";;
      parthdev )
        prepare_env "$2";;
      master ) 
        prepare_env "$2";;
      testing ) 
        prepare_env "$2";;
      staging ) 
        prepare_env "$2";;
      production ) 
        prepare_env "$2";;
      * ) 
        echo "Invalid stage" && exit 1;;
  esac
}

prepare_env()
{
  ENV="$1"
  echo "Preparing $ENV app..."

  echo "export const publishDate = '" | tr -d '\n' > ./configs/publishDate.js && 
  date +'%m/%d/%Y %r' | tr -d '\n' >> ./configs/publishDate.js &&
  echo "';"  >> ./configs/publishDate.js && 
  
  cp ./configs/config.${ENV}.js ./configs/config.js
}

check_flags "$1" "$2"