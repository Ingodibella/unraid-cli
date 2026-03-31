name: Feature request
description: Suggest a new command, flag, or improvement.
labels: [enhancement]
body:
  - type: markdown
    attributes:
      value: |
        Have an idea? Tell us what you need and we will see where it fits.
  - type: textarea
    id: problem
    attributes:
      label: What problem are you trying to solve?
      description: Describe the real-world situation, not the technical solution.
      placeholder: I always ssh into my unraid server just to check container status...
    validations:
      required: true
  - type: textarea
    id: desired
    attributes:
      label: What would the ideal outcome look like?
      description: Show the command syntax or output you would want.
      placeholder: ucli containers list --output json --filter state=RUNNING
    validations:
      required: true
  - type: dropdown
    id: command-group
    attributes:
      label: Related command group
      options:
        - system
        - array
        - disks
        - containers
        - notifications
        - vms
        - shares
        - logs
        - services
        - network
        - schema
        - diagnostics
        - auth
        - config
        - completion
        - other / new group
    validations:
      required: false
