#! /usr/bin/env bash

ENV_NAME="<YOUR_ENV_NAME>"
PREFIX="/AboutTimeTours/$ENV_NAME"

aws ssm put-parameter \
    --name "$PREFIX/SES/restrictions" \
    --type "String" \
    --value "{\"allowAll\":false, \"fallbackDomain\": \"\"}" &

aws ssm put-parameter \
    --name "$PREFIX/SES/senderEmail" \
    --type "String" \
    --value "abouttimetours@testing.effectual.com" &

# Add your whitelisted numbers to the array
aws ssm put-parameter \
    --name "$PREFIX/SMS/restrictions" \
    --type "String" \
    --value "{\"allowAll\":false, \"allowedNumbers\": [\"\"]}" &

aws ssm put-parameter \
    --name "$PREFIX/android/accessEmail" \
    --type "String" \
    --value "com-abouttimetours-api@abouttimetours.iam.gserviceaccount.com" &

# Get this from Password State
aws ssm put-parameter \
    --name "$PREFIX/android/accessKey" \
    --type "SecureString" \
    --value "$(cat androidAccessKey.pem)" &

aws ssm put-parameter \
    --name "$PREFIX/android/appLink" \
    --type "String" \
    --value "market://details?id=com.abouttimetours.mobileapp" &

aws ssm put-parameter \
    --name "$PREFIX/android/packageName" \
    --type "String" \
    --value "com.abouttimetours.mobileapp" &

# TODO -- Move this to the services repo and deploy automatically
aws ssm put-parameter \
    --name "$PREFIX/android/processEndpoint" \
    --type "SecureString" \
    --value "ChangeMe" &

aws ssm put-parameter \
    --name "$PREFIX/android/version" \
    --type "String" \
    --value "{ \"buildNumber\": 1, \"appVersion\": \"1.0.0\" }" &

aws ssm put-parameter \
    --name "$PREFIX/download/appStore" \
    --type "String" \
    --value "https://apps.apple.com/us/app/id1499416456" &

aws ssm put-parameter \
    --name "$PREFIX/download/playStore" \
    --type "String" \
    --value "https://play.google.com/store/apps/details?id=com.abouttimetours.mobileapp" &

# TODO -- Make this a single param shared by all accounts
aws ssm put-parameter \
    --name "$PREFIX/googleApiKey" \
    --type "SecureString" \
    --value "ChangeMe" &

aws ssm put-parameter \
    --name "$PREFIX/ios/appLink" \
    --type "String" \
    --value "https://apps.apple.com/us/app/id1499416456" &

# TODO -- Make this a single param shared by all accounts
aws ssm put-parameter \
    --name "$PREFIX/ios/appSecret" \
    --type "SecureString" \
    --value "ChangeMe" &

# TODO -- Move this to the services repo and deploy this automatically
aws ssm put-parameter \
    --name "$PREFIX/ios/processEndpoint" \
    --type "SecureString" \
    --value "ChangeMe" &

aws ssm put-parameter \
    --name "$PREFIX/ios/verificationEndpoint" \
    --type "String" \
    --value "https://sandbox.itunes.apple.com/verifyReceipt" &

aws ssm put-parameter \
    --name "$PREFIX/ios/version" \
    --type "String" \
    --value "{ \"buildNumber\": 1, \"appVersion\": \"1.0.0\" }" \