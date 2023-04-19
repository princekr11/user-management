### Git Setup

- Setup SSH Keys: https://help.github.com/articles/generating-ssh-keys/ **DO NOT SET ANY PASSPHRASE FOR THE SSH KEY**
- Clone our repository **(strictly with SSH)** : `git clone git@git.valuefy.com:hdfc-delta/backend/services/user-management.git`

### Git Guidelines

- Keep logical commits and code formatting commits separate.
- Proper commit message is a must.
- Make your commits at most granular level. Make frequent commits with little code changes rather than seldom commits with huge code change.
- Do not use https for auth. Always rely on ssh.
- Make sure you get your code reviewed before merging to main.
- `main` branch should always be stable branch and same as production servers.
- Never force push main branch.
- Do not merge your branch in main locally. Always create a pull request.
- Create different branches for different features. This will help in reducing features inter-dependnce at the time of deployment.
- Never force-push a branch to server

### Frequently used git command set

Before starting work on a new feature, make sure to switch to `main` branch and pull the latest code. Create a new branch from it locally
and push to server

```
git checkout main
git pull origin main
git checkout -b feature-abc
git push -u origin feature-abc
```

To see your unstaged changes

```
git diff
```

To get latest code from main branch into your branch, rebase!

```
git rebase main
```

You can also do a local merge from mastr branch to your feature branch. Make sure to never do this merge on server using a pull request.

```
git merge main
```

To store uncommited changes locally, stash them

```
git stash
```

Apply last stash to bring it back

```
git stash apply
```

To rebase your branch before pushing to server

```
git pull --rebase origin feature-abc
```

To push your changes to server

```
git push origin feature-abc
```
