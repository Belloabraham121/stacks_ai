import boto3
import json

# Set up the Bedrock client
client = boto3.client('bedrock-runtime', region_name='us-east-1')

# Invoke the model
response = client.invoke_model(
    modelId='amazon.titan-embed-text-v2:0:8k',
    body=json.dumps({"inputText": "test"})
)

# Print the response
print(response)