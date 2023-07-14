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

sam-build: sam-validate compile
	sam build

sam-build-sandbox: sam-validate-sandbox compile
	sam build --template-file sandbox_template.yaml

sam-run-local: sam-build
	sam local start-api

sam-sync: guard-AWS_DEFAULT_PROFILE guard-stack_name compile
	sam sync \
		--stack-name $$stack_name \
		--watch \
		--parameter-overrides \
			  EnableSplunk=false

sam-sync-sandbox: guard-stack_name compile
	sam sync \
		--stack-name $$stack_name-sandbox \
		--watch \
		--template-file sandbox_template.yaml \
		--parameter-overrides \
			  EnableSplunk=false

sam-deploy: guard-AWS_DEFAULT_PROFILE guard-stack_name
	sam deploy \
		--stack-name $$stack_name \
		--parameter-overrides \
			  EnableSplunk=false \
			  TargetSpineServer=$$TARGET_SPINE_SERVER

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

sam-validate-sandbox: 
	sam validate --template-file sandbox_template.yaml

sam-deploy-package: guard-artifact_bucket guard-artifact_bucket_prefix guard-stack_name guard-template_file guard-cloud_formation_execution_role guard-LATEST_TRUSTSTORE_VERSION guard-enable_mutual_tls guard-SPLUNK_HEC_TOKEN guard-SPLUNK_HEC_ENDPOINT guard-VERSION_NUMBER guard-COMMIT_ID
	sam deploy \
		--template-file $$template_file \
		--stack-name $$stack_name \
		--capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
		--region eu-west-2 \
		--s3-bucket $$artifact_bucket \
		--s3-prefix $$artifact_bucket_prefix \
		--config-file samconfig_package_and_deploy.toml \
		--no-fail-on-empty-changeset \
		--role-arn $$cloud_formation_execution_role \
		--no-confirm-changeset \
		--force-upload \
		--parameter-overrides \
			  SplunkHECToken=$$SPLUNK_HEC_TOKEN \
			  SplunkHECEndpoint=$$SPLUNK_HEC_ENDPOINT \
			  TruststoreVersion=$$LATEST_TRUSTSTORE_VERSION \
			  EnableMutualTLS=$$enable_mutual_tls \
			  TargetSpineServer=$$target_spine_server \
			  EnableSplunk=true \
			  VersionNumber=$$VERSION_NUMBER \
			  CommitId=$$COMMIT_ID

compile-node:
	npx tsc --build tsconfig.build.json

compile-go:
	cd packages/getSecretLayer && ./build.sh

compile: compile-node compile-go

lint-node: compile-node
	npm run lint --workspace packages/capabilityStatement
	npm run lint --workspace packages/getMyPrescriptions
	npm run lint --workspace packages/middleware
	npm run lint --workspace packages/sandbox
	npm run lint --workspace packages/splunkProcessor
	npm run lint --workspace packages/statusLambda
	npm run lint --workspace packages/spineClient

lint-go:
	cd packages/getSecretLayer/src && golangci-lint run

lint: lint-node lint-go

test: compile
	npm run test --workspace packages/capabilityStatement
	npm run test --workspace packages/getMyPrescriptions
	npm run test --workspace packages/middleware
	npm run test --workspace packages/sandbox
	npm run test --workspace packages/statusLambda
	npm run test --workspace packages/spineClient

clean:
	rm -rf packages/capabilityStatement/coverage
	rm -rf packages/getMyPrescriptions/coverage
	rm -rf packages/middleware/coverage
	rm -rf packages/sandbox/coverage
	rm -rf packages/specification/coverage
	rm -rf packages/spineClient/coverage
	rm -rf packages/splunkProcessor/coverage
	rm -rf packages/statusLambda/coverage
	rm -rf packages/capabilityStatement/lib
	rm -rf packages/getMyPrescriptions/lib
	rm -rf packages/middleware/lib
	rm -rf packages/sandbox/lib
	rm -rf packages/specification/lib
	rm -rf packages/spineClient/lib
	rm -rf packages/splunkProcessor/lib
	rm -rf packages/statusLambda/lib
	rm -rf packages/getSecretLayer/lib
	rm -rf .aws-sam

deep-clean: clean
	rm -rf .venv
	find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +

check-licenses:
	npm run check-licenses --workspace packages/getMyPrescriptions
	scripts/check_python_licenses.sh

aws-configure:
	aws configure sso --region eu-west-2

aws-login:
	aws sso login --sso-session sso-session
