# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 1 |
| Informational | 3 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Low | Exceeded High | http://host.docker.internal:3000 | Percentage of responses with status code 4xx | 99 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of responses with status code 2xx | 1 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with content type application/json | 86 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with content type text/html | 12 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with method GET | 58 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with method PATCH | 29 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with method POST | 12 % |
| Info | Informational | http://host.docker.internal:3000 | Count of total endpoints | 72    |
| Info | Exceeded Low | http://host.docker.internal:3000 | Percentage of slow responses | 6 % |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Unexpected Content-Type was returned | Low | 10 |
| A Client Error response code was returned by the server | Informational | 71 |
| Authentication Request Identified | Informational | 1 |
| Non-Storable Content | Informational | Systemic |




## Alert Detail



### [ Unexpected Content-Type was returned ](https://www.zaproxy.org/docs/alerts/100001/)



##### Low (High)

### Description

A Content-Type of text/html was returned by the server.
This is not one of the types expected to be returned by an API.
Raised by the 'Alert on Unexpected Content Types' script

* URL: http://host.docker.internal:3000
  * Node Name: `http://host.docker.internal:3000`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:3000/
  * Node Name: `http://host.docker.internal:3000/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:3000/3421268511804905983
  * Node Name: `http://host.docker.internal:3000/3421268511804905983`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:3000/computeMetadata/v1/
  * Node Name: `http://host.docker.internal:3000/computeMetadata/v1/ ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:3000/latest/meta-data/
  * Node Name: `http://host.docker.internal:3000/latest/meta-data/ ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:3000/metadata/instance
  * Node Name: `http://host.docker.internal:3000/metadata/instance ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:3000/metadata/v1
  * Node Name: `http://host.docker.internal:3000/metadata/v1 ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:3000/opc/v1/instance/
  * Node Name: `http://host.docker.internal:3000/opc/v1/instance/ ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:3000/opc/v2/instance/
  * Node Name: `http://host.docker.internal:3000/opc/v2/instance/ ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:3000/openstack/latest/meta_data.json
  * Node Name: `http://host.docker.internal:3000/openstack/latest/meta_data.json ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``


Instances: 10

### Solution



### Reference




#### Source ID: 4

### [ A Client Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Informational (High)

### Description

A response code of 400 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://host.docker.internal:3000/3421268511804905983
  * Node Name: `http://host.docker.internal:3000/3421268511804905983`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api
  * Node Name: `http://host.docker.internal:3000/api`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/
  * Node Name: `http://host.docker.internal:3000/api/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/3714957600368157197
  * Node Name: `http://host.docker.internal:3000/api/3714957600368157197`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin
  * Node Name: `http://host.docker.internal:3000/api/admin`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/
  * Node Name: `http://host.docker.internal:3000/api/admin/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/9117539431686617201
  * Node Name: `http://host.docker.internal:3000/api/admin/9117539431686617201`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/audit
  * Node Name: `http://host.docker.internal:3000/api/admin/audit`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/audit/
  * Node Name: `http://host.docker.internal:3000/api/admin/audit/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/users
  * Node Name: `http://host.docker.internal:3000/api/admin/users`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/users%3Frole=admin&status=activo
  * Node Name: `http://host.docker.internal:3000/api/admin/users (role,status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/users/
  * Node Name: `http://host.docker.internal:3000/api/admin/users/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60
  * Node Name: `http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/
  * Node Name: `http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/5656874785450907837
  * Node Name: `http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/5656874785450907837`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/actuator/health
  * Node Name: `http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/actuator/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/users/6023630712081737142
  * Node Name: `http://host.docker.internal:3000/api/admin/users/6023630712081737142`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth
  * Node Name: `http://host.docker.internal:3000/api/auth`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/
  * Node Name: `http://host.docker.internal:3000/api/auth/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/6304790615531147779
  * Node Name: `http://host.docker.internal:3000/api/auth/6304790615531147779`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/me
  * Node Name: `http://host.docker.internal:3000/api/auth/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/me/
  * Node Name: `http://host.docker.internal:3000/api/auth/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations
  * Node Name: `http://host.docker.internal:3000/api/donations`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations%3Fstatus=disponible&category=alimentos&q=arroz
  * Node Name: `http://host.docker.internal:3000/api/donations (category,q,status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations/
  * Node Name: `http://host.docker.internal:3000/api/donations/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60
  * Node Name: `http://host.docker.internal:3000/api/donations/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/
  * Node Name: `http://host.docker.internal:3000/api/donations/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/2590258925656956501
  * Node Name: `http://host.docker.internal:3000/api/donations/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/2590258925656956501`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations/5753889915375781498
  * Node Name: `http://host.docker.internal:3000/api/donations/5753889915375781498`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests
  * Node Name: `http://host.docker.internal:3000/api/requests`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests%3Fstatus=pendiente&donationId=donationId
  * Node Name: `http://host.docker.internal:3000/api/requests (donationId,status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/
  * Node Name: `http://host.docker.internal:3000/api/requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/6352345724402975738
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/6352345724402975738`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/6275711591288752519
  * Node Name: `http://host.docker.internal:3000/api/requests/6275711591288752519`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/stats
  * Node Name: `http://host.docker.internal:3000/api/stats`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/stats/
  * Node Name: `http://host.docker.internal:3000/api/stats/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/stats/6339410751832378160
  * Node Name: `http://host.docker.internal:3000/api/stats/6339410751832378160`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/status
  * Node Name: `http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/status ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/status/
  * Node Name: `http://host.docker.internal:3000/api/admin/users/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/status/ ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/cancel
  * Node Name: `http://host.docker.internal:3000/api/donations/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/cancel`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/cancel/
  * Node Name: `http://host.docker.internal:3000/api/donations/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/cancel/`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/approve
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/approve`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/approve/
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/approve/`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/cancel
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/cancel`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/cancel/
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/cancel/`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/confirm
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/confirm`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/confirm/
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/confirm/`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/reject
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/reject ()({reason})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/reject/
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/reject/ ()({reason})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/revoke
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/revoke ()({reason})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/revoke/
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/revoke/ ()({reason})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/computeMetadata/v1/
  * Node Name: `http://host.docker.internal:3000/computeMetadata/v1/ ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/latest/meta-data/
  * Node Name: `http://host.docker.internal:3000/latest/meta-data/ ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/metadata/instance
  * Node Name: `http://host.docker.internal:3000/metadata/instance ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/metadata/v1
  * Node Name: `http://host.docker.internal:3000/metadata/v1 ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/opc/v1/instance/
  * Node Name: `http://host.docker.internal:3000/opc/v1/instance/ ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/opc/v2/instance/
  * Node Name: `http://host.docker.internal:3000/opc/v2/instance/ ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/openstack/latest/meta_data.json
  * Node Name: `http://host.docker.internal:3000/openstack/latest/meta_data.json ()({status})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/login
  * Node Name: `http://host.docker.internal:3000/api/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/login
  * Node Name: `http://host.docker.internal:3000/api/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/login
  * Node Name: `http://host.docker.internal:3000/api/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `423`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/login/
  * Node Name: `http://host.docker.internal:3000/api/auth/login/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `423`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/register
  * Node Name: `http://host.docker.internal:3000/api/auth/register ()({name,email,password,role,organization})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/register
  * Node Name: `http://host.docker.internal:3000/api/auth/register ()({name,email,password,role,organization})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `409`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/register/
  * Node Name: `http://host.docker.internal:3000/api/auth/register/ ()({name,email,password,role,organization})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations
  * Node Name: `http://host.docker.internal:3000/api/donations ()({title,category,quantity,unit,expiresAt,location,description})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/donations/
  * Node Name: `http://host.docker.internal:3000/api/donations/ ()({title,category,quantity,unit,expiresAt,location,description})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests
  * Node Name: `http://host.docker.internal:3000/api/requests ()({donationId,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/
  * Node Name: `http://host.docker.internal:3000/api/requests/ ()({donationId,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``


Instances: 71

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (High)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://host.docker.internal:3000/api/auth/login
  * Node Name: `http://host.docker.internal:3000/api/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`


Instances: 1

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/)



#### Source ID: 3

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: http://host.docker.internal:3000/api/health
  * Node Name: `http://host.docker.internal:3000/api/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/cancel
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/cancel`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `PATCH `
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/revoke
  * Node Name: `http://host.docker.internal:3000/api/requests/3f1c2b8e-9a4d-4c1e-8f2a-1b2c3d4e5f60/revoke ()({reason})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `PATCH `
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/login
  * Node Name: `http://host.docker.internal:3000/api/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/register
  * Node Name: `http://host.docker.internal:3000/api/auth/register ()({name,email,password,role,organization})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``

Instances: Systemic


### Solution

The content may be marked as storable by ensuring that the following conditions are satisfied:
The request method must be understood by the cache and defined as being cacheable ("GET", "HEAD", and "POST" are currently defined as cacheable)
The response status code must be understood by the cache (one of the 1XX, 2XX, 3XX, 4XX, or 5XX response classes are generally understood)
The "no-store" cache directive must not appear in the request or response header fields
For caching by "shared" caches such as "proxy" caches, the "private" response directive must not appear in the response
For caching by "shared" caches such as "proxy" caches, the "Authorization" header field must not appear in the request, unless the response explicitly allows it (using one of the "must-revalidate", "public", or "s-maxage" Cache-Control response directives)
In addition to the conditions above, at least one of the following conditions must also be satisfied by the response:
It must contain an "Expires" header field
It must contain a "max-age" response directive
For "shared" caches such as "proxy" caches, it must contain a "s-maxage" response directive
It must contain a "Cache Control Extension" that allows it to be cached
It must have a status code that is defined as cacheable by default (200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501).

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3


