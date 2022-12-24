#!/bin/bash

# combine lcov files and serve the html
# requirement: sudo apt install lcov

for cmd in lcov genhtml; do
  command -v $cmd &>/dev/null || {
    echo ${cmd} command doesnt exist
    exit 1
  }
done

parent_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && cd .. && pwd)

dir=${parent_dir}/lcov_report
rm -rf ${dir} && mkdir -p ${dir}

cat ${parent_dir}/src-tauri/coverage/lcov.info >${dir}/src-tauri.info &&
  lcov -r ${dir}/src-tauri.info "${parent_dir}/src-tauri/patches/*" -o ${dir}/src-tauri.info &&
  lcov --rc lcov_branch_coverage=1 -a ${parent_dir}/coverage/lcov.info -a ${dir}/src-tauri.info -o ${dir}/merged.info &&
  cd ${parent_dir} && genhtml -o ${dir} ${dir}/merged.info --prefix ${parent_dir}

[ "$1" == "serve" ] && {
  cd ${dir}
  python3 -m http.server
} || exit 0
