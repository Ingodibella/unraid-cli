name: Bug report
description: Report something not working as expected.
labels: [bug]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to file a bug. Please include as much as you can from the checklist below.
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Describe the issue and what you expected instead.
      placeholder: Running `ucli containers list --output json` returns an error about...
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: ucli version
      description: Run `ucli --version` or check `package.json`.
    validations:
      required: true
  - type: input
    id: unraid-version
    attributes:
      label: Unraid version
      description: The version of Unraid Server you are connecting to.
    validations:
      required: false
  - type: textarea
    id: command
    attributes:
      label: Command and output
      description: The full command you ran, plus stdout/stderr.
      render: bash
    validations:
      required: true
  - type: textarea
    id: context
    attributes:
      label: Additional context
      description: Anything else that might help reproduce this.
    validations:
      required: false
