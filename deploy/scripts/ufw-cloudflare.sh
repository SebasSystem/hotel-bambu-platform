#!/bin/sh
# Host firewall for the Caddy ingress (run as root on the VPS, re-run to refresh the ranges):
#   sudo sh deploy/scripts/ufw-cloudflare.sh [ssh-port]
# Result: deny all incoming except SSH (rate limited) and 443/tcp from Cloudflare's published
# ranges. This is what makes TRUST_CLOUDFLARE=true safe (nobody else can reach the origin).
#
# Docker note: ports published by Docker bypass ufw's INPUT chain. This script therefore also
# filters Docker-published traffic in the DOCKER-USER chain (iptables), so only Cloudflare can
# reach the Caddy container on 443.
set -eu

SSH_PORT="${1:-22}"
V4="$(curl -fsS --max-time 20 https://www.cloudflare.com/ips-v4)"
V6="$(curl -fsS --max-time 20 https://www.cloudflare.com/ips-v6)"
[ -n "$V4" ] && [ -n "$V6" ] || { echo "Could not download Cloudflare ranges" >&2; exit 1; }

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw limit "${SSH_PORT}/tcp" comment 'ssh'
for range in $V4 $V6; do
  ufw allow proto tcp from "$range" to any port 443 comment 'cloudflare'
done
ufw --force enable

# DOCKER-USER: drop 443 traffic to containers unless it comes from Cloudflare.
iptables -F DOCKER-USER 2>/dev/null || iptables -N DOCKER-USER
iptables -A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
for range in $V4; do
  iptables -A DOCKER-USER -p tcp --dport 443 -s "$range" -j RETURN
done
iptables -A DOCKER-USER -p tcp --dport 443 -j DROP
iptables -A DOCKER-USER -j RETURN
if command -v ip6tables > /dev/null; then
  ip6tables -F DOCKER-USER 2>/dev/null || ip6tables -N DOCKER-USER
  ip6tables -A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
  for range in $V6; do
    ip6tables -A DOCKER-USER -p tcp --dport 443 -s "$range" -j RETURN
  done
  ip6tables -A DOCKER-USER -p tcp --dport 443 -j DROP
  ip6tables -A DOCKER-USER -j RETURN
fi

echo "ufw + DOCKER-USER configured: SSH ${SSH_PORT} and 443 from Cloudflare only."
echo "DOCKER-USER rules are not persistent: install iptables-persistent and run"
echo "  netfilter-persistent save"
echo "or re-run this script after every reboot (see deploy/README.md)."
ufw status numbered
