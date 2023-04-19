FROM registry.access.redhat.com/ubi8/nodejs-16-minimal

USER root

RUN rpm -ivh https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm

RUN microdnf update && microdnf upgrade -y && microdnf install ghostscript poppler-utils GraphicsMagick java-11-openjdk-headless vim -y && microdnf clean all && \
  rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

ENV TZ="Asia/Kolkata"

USER 1001

WORKDIR /opt/app-root/src
# Bundle app source code

COPY --chown=1001 . /opt/app-root/src

RUN npm run build
# Bind to all network interfaces so that it can be mapped to the host OS
ENV HOST=0.0.0.0 PORT=3018

EXPOSE ${PORT}

HEALTHCHECK --interval=5m --timeout=10s CMD curl -f http://localhost:3018/API/UserManagement/ping || exit 1
#ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node","-r", "source-map-support/register","."]
