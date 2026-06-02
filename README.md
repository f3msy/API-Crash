# Basic Realm API Crash Tool

A command-line tool for crashing Minecraft Realms.

## Features

- **Join Realms by Code**: Join any Minecraft Realm using a realm code
- **Crash Realms**: Crash existing realms from your realmlist
- **Auto-detect Realm Status**: Automatically checks if realms are open or closed before attempting to crash

## Prerequisites

- Node.js installed
- Microsoft account with Xbox Live

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

Run the script, or open the **`start.bat`** file.
```bash
node loop
```

### Menu Options

**Option 1: Join Realm by Code**
- Enter a realm code to join a Minecraft Realm
- After joining, you can return to the menu to join another realm

**Option 2: Crash Existing Realm**
- Displays a list of your realms with their status (open/closed)
- Shows realm name and ID
- Select a realm by ID to crash it
- Only open realms can be crashed

### Authentication

On first run, you'll need to authenticate with Microsoft:
1. A link will be displayed: `http://microsoft.com/link?otc=CODE`
2. Open the link in your browser
3. Sign in with your Microsoft account
4. The script will automatically continue after authentication

### Realm Status Detection

The tool automatically checks if each realm is joinable by:
1. Fetching realm information from the API
2. Testing if the realm can be joined
3. Displaying status as `open` or `closed`

## Notes

- The script caches authentication tokens in the `meow` directory
- Realm status checking may take a few seconds depending on the number of realms
- Only realms with valid active slots can be crashed
