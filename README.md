# Container Day - ECS Demos

## Local Container Benefits

### Example of running stock nginx from Docker Hub

1. Run `docker run -d -p 8080:80 --name nginx nginx:latest` to run nginx in the background as a daemon as well as map port 8080 on our host to 80 in the container
    1. The -d is to run it as a daemon (in the background), the -p maps the host port 8080 to 80 in the container, --name gives us a name we can run further docker commands against easily and then the image repository and tag we want to run.
    1. Run `docker ps` to see our container running
    1. Run `docker logs nginx --follow` to tail the logs the container is sending to STDOUT (including its access logs)
    1. Go to `http://localhost:8080`
    1. Refresh the browser tab a few times and then come back to see the new log line entries
    1. Press Ctrl-C to exit the log tailing
1. Run `docker stop nginx` to stop our container
1. Run `docker ps -a` (-a means all including the stopped containers) to see that our container is still there but stopped. At this point it could be restarted with a `docker start nginx` if we wanted.
1. Run `docker rm nginx` to remove the stopped container from our machine then another `docker ps -a` to confirm it is now gone
1. Run `docker images` to see that the nginx:latest image is there there cached

### Now let's customise nginx with our own content - nyancat
1. Run `cd ~/container-day-ecs/aws-cdk-nyan-cat/nyan-cat`
1. Run `cat Dockerfile` - this start from the upstream nginx image and then copies the contents of this path into /usr/share/nginx/html in our container - replacing the default page it ships with
1. Run `docker build -t nyancat:latest .` to build an image called nyancat:latest from that Dockerfile
1. Run `docker history nyancat:latest` to see all of the commands and layers that make up the image - see our new layer?
1. Run `docker run --rm -d -p 8080:80 --name nyancat nyancat:latest` (--rm means to delete the container once it is stopped rather than leave it around to be restarted) 
1. Go to `http://localhost:8080`
    1. See our new content that is built into the image for nginx to serve?
1. Run `docker stop nyancat` to stop and clean up that container (we said --rm so Docker will automatically clean it up when it stops)

### Compiling your app within the docker build

Getting a local development environment with the 'right' versions of things like the JDK and associated tooling can be complicated. With docker we can have the docker build do the build but also do it in another build stage and then only copy the artifacts across we need at runtime to our runtime container image with multi-stage docker builds.

This example is Spring Boot's (a common Enterprise Java Framework) Docker demo/example. But it could apply to any compiled language.

1. Run `cd ~/container-day-ecs/top-spring-boot-docker/demo`
1. Run `cat Dockerfile` and see our two stages - the first running a Maven install and the second taking only the JAR and putting it in a runtime container image as we don't need all those build artifacts at runtime keeping the runtime image lean.
1. Run `docker build -t spring-app:latest .` to do the build. This will take awhile for it to pull Spring Boot down from Maven etc. We don't have the JDK or tools installed on our Cloud9 but are compiling a Java app. If different apps needed different version of the JDK or tools you could easily build them all on the same machine this way too.
1. Once that is complete re-run the `docker build -t spring-app .` command a 2nd time. See how much faster it goes once it has cached everything locally?
1. Run `docker run --rm -d -p 8080:8080 --name spring spring-app:latest` to run our container.
1. Run `curl http://localhost:8080` - it just returns Hello World (and Spring Boot is a very heavy framework to just do that! We wanted to see how you'd do a heavy Enterprise Java app though)
1. Run `docker stop spring`

## Local Windows Containers
1. Run `cd windows`
1. Run `cat Dockerfile` - the base image is Windows Server Core LTSC2019 with IIS pre-installed and we are copying our nyan-cat static content into it to serve just like we did with nginx.
1. Run `docker build -t nyancat-windows:latest .`
1. Run `docker run --rm -d -p 8080:80 --name nyancat-windows nyancat-windows:latest`
1. Open http://localhost:8080 in a browser
1. Open Developer Tools
1. Under Network -> Headers show that the source is Microsoft-IIS 10
1. Run `docker stop nyancat-windows`

## Copilot - Linux
`copilot app init --domain jasonumiker.com nycancat`
`copilot init` then choose the following options: 
- Load Balanced Web Service
- www
- /home/jumiker/container-day-ecs/aws-cdk-nyan-cat/nyan-cat/Dockerfile
- 80
- Y
Edit manifest to add alias

## Copilot - Windows
`copilot app init --domain jasonumiker.com nycancat-windows`
`copilot init` then choose the following options:
Edit manifest to add alias

## CDK

1. Run `cd aws-cdk-nyan-cat/cdk`
1. Run `nano lib/cdk-stack.ts`:
    - We're using the higher-level class ApplicationLoadBalancedFargateService
    - We're telling it the ContainerImage is fromAsset - that it should build it locally with docker build then push it up to a new ECR repo it should create. If this image was already in ECR we could ask it to do that instead.
    - Other than one line creating a VPC and one line creating an ECS cluster that's all we need!
1. Run `npx cdk synth` - this generates us a CloudFormation Template. It is often a good idea to make sure that works before trying to do a `npx cdk deploy` which will generate then immediatly deploy the template.
    - Run `nano cdk.out/CdkStack.template.json` and note it says Read 1096 lines - CDK turned a few lines of TypeScript into over 1000 lines of CloudFormation for us!
1. Run `npx cdk deploy`
1. Go to the ALB address in your browser
1. Go to the ECS console and show the service running there

## Credits

https://github.com/nathanpeck/aws-cdk-nyan-cat
https://github.com/spring-guides/top-spring-boot-docker