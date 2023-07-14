This folder contains cloudformation definitions for 'manually' created resources that are only created once per environment. These need to manually applied as they are not created as part of a CI or pull request build

# CI Resources

ci_resources.yml contains resources that are needed for the CI pipeline to work. This should be applied to each environment.  
It creates the following resources

- OIDC provider allowing github to assume a role in the account
- Cloudformation deploy role - github runners assume this role
- Cloudformation execution role - cloudformation uses this role when applying a changeset. This has minimum permissions so if a new resource type is added, the permissions will need modifying
- Artifact bucket and KMS key - resources used by CI build are uploaded to this bucket
- Trust store bucket and KMS key - public CA certs used for mutual TLS are uploaded to this bucket
- Secrets and KMS key - there are various secrets created for storing keys used in mutual TLS. These have a default value set, but the values are modified when creating new keys.
- - CAKeySecret - used to store the private CA key
- - CACertSecret - used to store the public CA cert
- - ClientKeySecret - used to store the private client key
- - ClientCertSecret - used to store the public client cert

The stack deployed in each environment must be called `ci-resources` as the deployment pipeline gets the bucket and cloudformation execution role from the stack as part of its processing.

To deploy the stack, use the following

```
export AWS_PROFILE=<name of AWS profile defined in ~/.aws/config>
aws sso login --sso-session sso-session

aws cloudformation deploy \
          --template-file cloudformation/ci_resources.yml \
          --stack-name ci-resources \
          --region eu-west-2 \
          --capabilities CAPABILITY_IAM
```

Once this is deployed, you should get the ARN for the role `ci-resources:CloudFormationDeployRole` using this command

```
aws cloudformation list-exports \
    --query 'Exports[?Name==`ci-resources:CloudFormationDeployRole`].Value' --output text
```

This value should then be stored in the github project as a repository secret called `<ENVIRONMENT>_CLOUD_FORMATION_DEPLOY_ROLE`

# Route 53 resources - management account

management_route53.yml contains route 53 resources created in the management account. This should only be applied to the management account.  
It creates the following resources

- route 53 hosted zone for prescriptionsforpatients.national.nhs.uk
- NS records for {dev, int, ref, qa, prod}.prescriptionsforpatients.national.nhs.uk pointing to route 53 hosted zones in each account

To deploy the stack, use the following

```
export AWS_PROFILE=prescription-management
aws sso login --sso-session sso-session

aws cloudformation deploy \
          --template-file cloudformation/management_route53.yml \
          --stack-name route53-resources \
          --region eu-west-2
```

# Route 53 resources - environment accounts

environment_route53.yml contains route 53 resources created in each environment account.  
It creates the following resources

- route 53 hosted zone for {environment}.prescriptionsforpatients.national.nhs.uk

It outputs the following as exports as they are used in SAM deployments

- route53-resources:ZoneID - zoneID of zone created
- route53-resources:domain - domain name of the hosted zone

To deploy the stack, use the following

```
export AWS_PROFILE=<name of AWS profile defined in ~/.aws/config>
aws sso login --sso-session sso-session

aws cloudformation deploy \
          --template-file cloudformation/environment_route53.yml \
          --stack-name route53-resources \
          --region eu-west-2 \
          --parameter-overrides environment=<ENVIRONMENT>
```
