create_emails() 
{
  if [ "$1" != "--profile" ]; then
    echo "Usage: ./buildEmails.sh --profile <PROFILE_NAME>"
    exit 1
  fi

  if [ "$2" == "" ]; then
    echo "Usage: ./buildEmails.sh --profile <PROFILE_NAME>"
    exit 1
  fi

  filePrefix="file://"
 
  for filename in ./email-templates/*; do
    fileNameNoExtension=$(basename -- "$filename" .json)
    echo "Creating email for $fileNameNoExtension with profile $2"

    aws ses create-template --cli-input-json "$filePrefix$filename" --profile "$2"
  done
}

create_emails "$1" "$2"
