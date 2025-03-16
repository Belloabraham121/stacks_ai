import boto3
import json

client = boto3.client('bedrock-runtime', region_name='us-east-1')
body = json.dumps({"inputText": "test"})

try:
    response = client.invoke_model(
        body=body,
        contentType='application/json',
        accept='application/json',
        modelId='amazon.titan-embed-text-v1'
    )
    print(response['body'].read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")