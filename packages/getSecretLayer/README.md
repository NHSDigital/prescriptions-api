This is used to create a lambda layer that can be called on lambda startup that injects secret values into environment variables.  
It should be used by any lambda that uses spineClient to set spine connectivity variables

To use it, in a SAM template the following should be set in the Properties section of the `AWS::Serverless::Function` definition

```
Environment:
    Variables:
        AWS_LAMBDA_EXEC_WRAPPER: /opt/get-secrets-layer
Layers:
    - !Ref GetSecretsLayer
```

The src folder contains

- a go program that retrieves a secret from an ARN and outputs the value
- a shell script that calls the compiled go program and sets environment variables to the values of the secrets

The code is modified from the article at https://aws.amazon.com/blogs/compute/creating-aws-lambda-environmental-variables-from-aws-secrets-manager/
