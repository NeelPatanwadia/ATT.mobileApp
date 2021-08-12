#! /usr/bin/env bash
set -e

## Process arguments
while [[ $# -gt 0 ]]; do
    key="$1"

    case $key in
    --stage)
        stage="$2"
        shift
        ;;
    --profile)
        profile="$2"
        shift
        ;;
    --config_file)
        config_file="$2"
        shift
        ;;
    *) ;;

    esac

    shift
done

# App name
app_name="$(jq -r '.expo.name' app.json)"
app_identifier="$(jq -r '.expo.ios.bundleIdentifier' app.json)"

# Apple Dev Creds
apple_username="$(jq -r '.apple.username' "$config_file")"
apple_team_name="$(jq -r '.apple.team_name' "$config_file")"

# Install dependencies
yarn install

# Configure Environment
./prepareEnv.sh --stage ${stage}

amplify env checkout ${stage}
amplify push -y

# Bump Version
currentBuildNumber=$(fastlane run latest_testflight_build_number username:"${apple_username}" team_name:"${apple_team_name}" app_identifier:"${app_identifier}" | grep -oEi "\d+$" | HEAD -1)
newBuildNumber=$(expr $currentBuildNumber + 1)
## Update app.json
jq -c '.expo.ios.buildNumber |= ($nextBuildNumber|tostring) | .expo.android.versionCode = $nextBuildNumber' --argjson nextBuildNumber ${newBuildNumber} app.json | jq '.' >tmp.$$.json && mv tmp.$$.json app.json
## Update ios
fastlane run increment_build_number build_number:"${newBuildNumber}" xcodeproj:"./ios/AboutTimeTours.xcodeproj"
## Update Android
## TODO: Figure out command that goes here. :-)
echo "---------- Set version in build.gradle to ${newBuildNumber} manually ----------"

# Publish
expo publish --release-channel ${stage} --non-interactive

# Build and Deploy
echo "
----------
You need to run the builds from xcode and android studio and distribute the builds manually
----------
"
