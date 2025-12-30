FROM pudding/docker-image-base:node20-bookworm-20240712.144902
RUN apt-get update
RUN apt-get install -y \
     imagemagick
RUN apt-get install -y \
     poppler-utils

# FROM node:18.12.1-buster

# RUN apt-get update

# RUN apt-get install -y \
#     imagemagick

# # COPY package.json /
# # RUN npm install

# CMD ["bash"]

# RUN echo "20231112-0002"