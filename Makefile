guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set"; \
		exit 1; \
	fi

.PHONY: install build test publish release clean

install: install-python install-hooks install-node

install-node:
	npm ci

install-python:
	poetry install

install-hooks: install-python
	poetry run pre-commit install --install-hooks --overwrite

sam-build:
	sam build

sam-run-local: sam-build
	sam local start-api

sam-sync: guard-AWS_DEFAULT_PROFILE guard-stack_name
	sam sync --stack-name $$stack_name --watch

sam-deploy: guard-AWS_DEFAULT_PROFILE guard-stack_name
	sam deploy --stack-name $$stack_name

sam-delete: guard-AWS_DEFAULT_PROFILE guard-stack_name
	sam delete --stack-name $$stack_name

sam-list-endpoints: guard-AWS_DEFAULT_PROFILE guard-stack_name
	sam list endpoints --stack-name $$stack_name

sam-list-resources: guard-AWS_DEFAULT_PROFILE guard-stack_name
	sam list resources --stack-name $$stack_name

sam-list-outputs: guard-AWS_DEFAULT_PROFILE guard-stack_name
	sam list stack-outputs --stack-name $$stack_name

sam-validate: 
	sam validate

sam-package: sam-validate guard-artifact-bucket guard-artifact-bucket-prefix
	sam package \
		--template-file template.yaml \
		--output-template-file packaged-service.yml \
		--s3-bucket $$artifact-bucket \
		--config-file samconfig_package_and_deploy.toml \
		--s3-prefix $$artifact-bucket-prefix
	aws s3 cp packaged-service.yml s3://$$artifact-bucket/$$artifact-bucket-prefix

sam-deploy-package: guard-artifact-bucket guard-artifact-bucket-prefix guard-stack-name
	aws s3 cp s3://$$artifact-bucket/$$artifact-bucket-prefix/packaged-service.yml .
	sam deploy \
		packaged-service.yml \
		--stack-name $$stack-name \
		--capabilities CAPABILITY_NAMED_IAM \
		--region eu-west-2 \
		--s3-bucket $$artifact-bucket \
		--s3-prefix $$artifact-bucket-prefix
		--config-file samconfig_package_and_deploy.toml \
		--no-fail-on-empty-changeset

lint:
	npm run lint --workspace packages/authz
	npm run lint --workspace packages/getMyPrescriptions

test:
	npm run test --workspace packages/authz
	npm run test --workspace packages/getMyPrescriptions

clean:
	rm -rf packages/authz/coverage
	rm -rf packages/getMyPrescriptions/coverage
	rm -rf .aws-sam

deep-clean: clean
	rm -rf .venv
	find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +

check-licenses:
	npm run check-licenses --workspace packages/authz
	npm run check-licenses --workspace packages/getMyPrescriptions
	scripts/check_python_licenses.sh

aws-configure:
	aws configure sso --region eu-west-2

aws-login:
	aws sso login --sso-session sso-session
