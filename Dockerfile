FROM n0computer/iroh-relay:latest

ENV RELAY_HTTP_PORT=3340 \
    RELAY_HTTPS_PORT=443 \
    RELAY_CERT_DIR=/var/lib/iroh-relay/certs

COPY relay-entrypoint.sh /usr/local/bin/relay-entrypoint.sh

RUN chmod +x /usr/local/bin/relay-entrypoint.sh \
    && mkdir -p /etc/iroh-relay /var/lib/iroh-relay/certs

EXPOSE 80 443 3340 9090

VOLUME ["/var/lib/iroh-relay/certs"]

ENTRYPOINT ["/usr/local/bin/relay-entrypoint.sh"]
